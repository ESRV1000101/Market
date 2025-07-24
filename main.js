// Clave de la API para JSONBin.io
        const MASTER_KEY = '$2a$10$CfialwaKlt.oEV.qHo/IHeu2aUczMtpVkCYXzMgUtZCpjmNU9pIGK';
        const BIN_ID = '687a974a2de0201b319ca267';
        const API_URL = `https://api.jsonbin.io/v3/b/`;
        const USERS_BIN_ID = '687b046c2de0201b319ccf2b'; // Nuevo bin para usuarios

        // NUEVO: Configuración para bins de categorías y productos
        const CATEGORIES_BIN_ID = '687f2380ae596e708fb99af7';
        const PRODUCTS_BIN_ID = '687f2362f7e7a370d1ebcc73';
        const CATEGORIES_API_URL = `https://api.jsonbin.io/v3/b/${CATEGORIES_BIN_ID}`;
        const PRODUCTS_API_URL = `https://api.jsonbin.io/v3/b/${PRODUCTS_BIN_ID}`;

        // Clave secreta para encriptación
        const SECRET_KEY = "market_secret_key_123!";

        //DATOS DE CATEGORÍAS Y PRODUCTOS
        let categories = [];
        let products = [];

        // ESTADOS ACTUALES
        //Carrito
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        //Usuario actual
        let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

        // Funciones de encriptación
        function encryptData(data) {
            return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
        }
        function decryptData(encryptedData) {
            const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
            return bytes.toString(CryptoJS.enc.Utf8);
        }

        // Toast notifications para reemplazar por alerts
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

        // Validaciones centralizadas
        function isValidName(name) {
            return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/.test(name);
        }
        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }
        function isValidPhone(phone) {
            return /^\d{9}$/.test(phone);
        }

        // Opciones de cantidad según unidad
        function getQuantityOptions(unit) {
            switch (unit) {
                case 'kilo':
                    return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} kilo${v > 1 ? 's' : ''}</option>`).join('');
                case 'atado*':
                    return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} atado*</option>`).join('');
                case 'mano':
                    return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} mano${v > 1 ? 's' : ''}</option>`).join('');
                case 'atado':
                    return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} atado${v > 1 ? 's' : ''}</option>`).join('');
                case 'docena':
                    return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} docena${v > 1 ? 's' : ''}</option>`).join('');
                case 'cajón':
                    return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} cajón${v > 1 ? 'es' : ''}</option>`).join('');
                case 'plancha':
                    return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} plancha${v > 1 ? 's' : ''}</option>`).join('');
                case 'unidad':
                    return Array.from({length: 10}, (_, i) => `<option value="${i+1}">${i+1} unidad${i > 0 ? 'es' : ''}</option>`).join('');
                case 'bandeja':
                    return [1, 2, 3, 4, 5].map(v => `<option value="${v}">${v} bandeja${v > 1 ? 's' : ''}</option>`).join('');
                default:
                    return `<option value="1">1</option>`;
            }
        }

        //CARGAR DATOS DE LA TIENDA DESDE API
        async function loadCategoriesData() {
            try {
                const response = await fetch(CATEGORIES_API_URL, {
                    method: 'GET',
                    headers: {
                        'X-Master-Key': MASTER_KEY,
                        'X-Bin-Meta': 'false'
                    }
                });
                if (!response.ok) throw new Error('Error al obtener las categorías');
                const data = await response.json();
                //return data.categories || [];
                
                // Filtrar solo categorías visibles
                return data.categories.filter(category => category.visible);
            } catch (e) {
                showToast('Error al cargar categorías', 'error');
                return [];
            }
        }

        async function loadProductsData() {
            try {
                const response = await fetch(PRODUCTS_API_URL, {
                    method: 'GET',
                    headers: {
                        'X-Master-Key': MASTER_KEY,
                        'X-Bin-Meta': 'false'
                    }
                });
                if (!response.ok) throw new Error('Error al obtener los productos');
                const data = await response.json();
                //return data.products || [];

                // Filtrar solo productos visibles
                return data.products.filter(product => product.visible);
            } catch (e) {
                showToast('Error al cargar productos', 'error');
                return [];
            }
        }

        // Función para mostrar una sección específica
        async function showSection(sectionId) {
            // Guardar la sección activa en localStorage
            //localStorage.setItem('activeSection', sectionId);

            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            // Ocultar todas las secciones
            document.querySelectorAll('section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Mostrar la sección solicitada
            document.getElementById(sectionId).classList.add('active');
            
            // Si es la tienda, cargar categorías y productos
            if (sectionId === 'store') {
                categories = await loadCategoriesData();
                products = await loadProductsData();
                loadCategories();
            }
            
            // Si es el carrito, actualizar la vista
            if (sectionId === 'cart') {
                updateCartView();
            }
            
            if (sectionId === 'profile') {
                if (!currentUser) {
                    showToast('Debes iniciar sesión para ver el perfil');
                    showSection('login');
                    return;
                }
                // Si es perfil, cargar datos del usuario y sus pedidos
                document.getElementById('profile-name').value = currentUser.name;
                document.getElementById('profile-email').value = currentUser.email;
                document.getElementById('profile-phone').value = currentUser.phone;
                document.getElementById('profile-address').value = currentUser.address;
                loadUserOrders();
            }
            
            // Cerrar menú móvil si está abierto
            document.querySelector('.nav-links').classList.remove('active');
        }

        // Función para alternar el menú móvil
        function toggleMenu() {
            document.querySelector('.nav-links').classList.toggle('active');
        }

        // Función para cargar categorías en la tienda
        function loadCategories() {
            /*const container = document.getElementById('categories-container');
            container.innerHTML = '';*/
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

        // Función para mostrar los productos de una categoría
        function showCategory(categoryId) {
            // Obtener la categoría
            const category = categories.find(cat => cat.id === categoryId);
            if (!category) return;
            
            // Actualizar título de categoría
            document.getElementById('category-title').textContent = category.name;
            
            // Obtener productos de esta categoría
            const categoryProducts = products.filter(product => product.categoryId === categoryId && product.visible);
            
            // Verificar unidades especiales para mostrar mensajes
            const messagesContainer = document.getElementById('unit-messages');
            messagesContainer.innerHTML = '';
            
            // Detectar unidades especiales
            const specialUnits = {
                'atado*': 'Atado*: tamaño mercado granel (6-8 veces más grande que supermercado)',
                'mano': 'Mano: equivalente a 5 unidades',
                'cajón': 'Cajón: aproximadamente 17 kilos por cajón',
                'plancha': 'Plancha: plancha por 30 unidades'
            };
            
            const foundUnits = new Set();
            
            categoryProducts.forEach(product => {
                if (specialUnits[product.unit]) {
                    foundUnits.add(specialUnits[product.unit]);
                }
            });
            
            // Mostrar mensajes si se encontraron unidades especiales
            if (foundUnits.size > 0) {
                foundUnits.forEach(message => {
                    const messageEl = document.createElement('p');
                    messageEl.textContent = message;
                    messagesContainer.appendChild(messageEl);
                });
            }
            
            // Cargar productos en el contenedor
            const container = document.getElementById('products-container');
            container.innerHTML = '';
            
            categoryProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';

                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p>Cantidad:</p>
                        <div class="product-actions">
                            <select class="quantity-select" id="quantity-${product.id}">
                                ${getQuantityOptions(product.unit)}
                            </select>
                            <button class="add-to-cart" onclick="addToCart(${product.id})">
                                <i class="fas fa-cart-plus"></i> Agregar
                            </button>
                        </div>
                    </div>
                `;
                container.appendChild(productCard);
            });
            
            // Mostrar la sección de categoría
            showSection('category');
        }
        
        // Función para agregar producto al carrito
        function addToCart(productId) {
            if (!currentUser) {
                showToast('Debes iniciar sesión para agregar productos al carrito');
                showSection('login');
                return;
            }
            
            // Encontrar el producto
            const product = products.find(p => p.id === productId);
            if (!product) return;
            
            // Obtener la cantidad seleccionada
            const quantitySelect = document.getElementById(`quantity-${productId}`);
            const quantity = parseFloat(quantitySelect.value);
            
            // Verificar si el producto ya está en el carrito
            const existingItemIndex = cart.findIndex(item => item.id === productId);
            
            if (existingItemIndex !== -1) {
                // Actualizar cantidad si ya existe
                cart[existingItemIndex].quantity = quantity;
            } else {
                // Agregar nuevo item al carrito
                cart.push({
                    id: product.id,
                    name: product.name,
                    unit: product.unit,
                    quantity: quantity,
                    image: product.image
                });
            }
            
            // Guardar en localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Actualizar contador de carrito
            updateCartCount();
            
            // Mostrar notificación
            showToast(`Se ha agregado ${product.name} al carrito`);
        }

        // Función para actualizar el contador del carrito
        function updateCartCount() {
            const totalItems = cart.reduce((total) => total + 1, 0);
            document.querySelector('.cart-count').textContent = totalItems;
        }

        // Función para actualizar la vista del carrito
        function updateCartView() {
            const container = document.getElementById('cart-items-container');
            container.innerHTML = '';
            
            if (cart.length === 0) {
                container.innerHTML = '<p style="text-align: center; padding: 2rem;">Tu carrito está vacío</p>';
                document.getElementById('checkout-btn').disabled = true;
                return;
            }
            
            // Calcular subtotal
            // let subtotal = 0;

            // Filtrar productos que podrían haber sido ocultados
            cart = cart.filter(item => {
                const product = products.find(p => p.id === item.id);
                return product && product.visible;
            });
            
            cart.forEach(item => {
                const itemTotal = item.quantity;
                // subtotal += itemTotal;
                
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div class="item-info">
                        <img src="${item.image}" alt="${item.name}" class="item-image">
                        <div class="item-details">
                            <span class="item-name">${item.name}</span>
                            <!--<span class="item-quantity">Cantidad: ${item.quantity} (${item.unit})</span>-->
                        </div>
                    </div>
                    <div class="item-actions">
                        <span class="item-price">${itemTotal.toFixed(1)} (${item.unit})</span>
                        <button class="remove-item" onclick="removeFromCart(${item.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                container.appendChild(cartItem);
            });
            
            // Actualizar sección de información del cliente
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
                        <label class="form-label" for="customer-notes">Notas adicionales (opcional)</label>
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
            
            // Validar formulario
            validateForm();
        }

        // Función para eliminar un producto del carrito
        function removeFromCart(productId) {
            cart = cart.filter(item => item.id !== productId);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            updateCartView();
            showToast('Producto eliminado del carrito', 'info');
        }

        // Función para vaciar el carrito
        function emptyCart() {
            if (confirm('¿Estás seguro de que deseas vaciar tu carrito?')) {
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                updateCartView();
                showToast('Carrito vaciado', 'info');
            }
        }

        // Función para validar el formulario de compra
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

        // ======== AUTENTICACIÓN DE USUARIOS ======== //
        
        // Función para obtener usuarios desde la nube
        async function fetchUsers() {
            try {
                const response = await fetch(`${API_URL}${USERS_BIN_ID}`, {
                    method: 'GET',
                    headers: {
                        'X-Master-Key': MASTER_KEY,
                        'X-Bin-Meta': 'false' // Solo obtenemos el contenido, sin metadatos
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Error en la solicitud: ${response.status}`);
                }
                
                const data = await response.json();
                return data.users || []; // Retornamos el array de usuarios
            } catch (error) {
                console.error('Error al obtener usuarios:', error);
                return [];
            }
        }
        
        // Función para guardar usuarios en la nube
        async function saveUsersToCloud(users) {
            try {
                const response = await fetch(`${API_URL}${USERS_BIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY
                    },
                    body: JSON.stringify({ users }) // Enviamos como objeto {users: [...]}
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
        
        // Función para registrar un nuevo usuario
        async function customerSignup() {
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const phone = document.getElementById('signup-phone').value.trim();
            const address = document.getElementById('signup-address').value.trim();
            const password = document.getElementById('signup-password').value;
            const errorEl = document.getElementById('signup-error');
            
            // Validar campos
            if (!name || !email || !phone || !address || !password) {
                errorEl.textContent = 'Todos los campos son obligatorios';
                errorEl.style.display = 'block';
                return;
            }
            
            // Validar nombre (solo letras y espacios)
            if (!isValidName(name)) {
                errorEl.textContent = 'El nombre debe contener solo letras y espacios (mínimo 3 caracteres)';
                errorEl.style.display = 'block';
                return;
            }
            
            // Validar formato de email
            if (!isValidEmail(email)) {
                errorEl.textContent = 'Por favor ingresa un correo válido (ejemplo@dominio.com)';
                errorEl.style.display = 'block';
                return;
            }
            
            // Validar teléfono (solo números, 9 dígitos)
            if (!isValidPhone(phone)) {
                errorEl.textContent = 'El teléfono debe tener exactamente 9 dígitos numéricos';
                errorEl.style.display = 'block';
                return;
            }
            
            try {
                // Obtener usuarios existentes
                const users = await fetchUsers();
                
                // Verificar si el correo ya está registrado
                if (users.some(user => user.email === email)) {
                    errorEl.textContent = 'Este correo ya está registrado';
                    errorEl.style.display = 'block';
                    return;
                }
                
                // Crear nuevo usuario
                const newUser = {
                    id: Date.now(), // ID único basado en timestamp
                    name,
                    email,
                    phone,
                    address,
                    password: encryptData(password), // Guardar encriptado
                    createdAt: new Date().toISOString()
                };
                
                // Agregar a la lista de usuarios
                users.push(newUser);
                
                // Guardar en la nube
                await saveUsersToCloud(users);
                
                // Iniciar sesión automáticamente
                currentUser = newUser;
                localStorage.setItem('currentUser', JSON.stringify(newUser));
                updateAuthLinks();
                
                // Limpiar formulario
                document.getElementById('signup-name').value = '';
                document.getElementById('signup-email').value = '';
                document.getElementById('signup-phone').value = '';
                document.getElementById('signup-address').value = '';
                document.getElementById('signup-password').value = '';
                
                // Mostrar mensaje de éxito
                showToast('¡Registro exitoso! Bienvenido a Market');

                // Redirigir al inicio
                showSection('home');
            } catch (error) {
                console.error('Error al registrar usuario:', error);
                errorEl.textContent = 'Hubo un error al registrarse. Inténtalo de nuevo.';
                errorEl.style.display = 'block';
            }
        }
        
        // Función para iniciar sesión
        async function customerLogin() {
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const errorEl = document.getElementById('login-error');
            
            // Validar campos
            if (!email || !password) {
                errorEl.textContent = 'Por favor completa todos los campos';
                errorEl.style.display = 'block';
                return;
            }
            
            try {
                // Obtener usuarios
                const users = await fetchUsers();
                
                // Buscar usuario por email y contraseña
                const user = users.find(u => 
                    u.email === email && 
                    decryptData(u.password) === password
                );
                
                if (user) {
                    // Iniciar sesión
                    currentUser = user;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    updateAuthLinks();
                    
                    // Limpiar formulario
                    document.getElementById('login-email').value = '';
                    document.getElementById('login-password').value = '';
                    errorEl.style.display = 'none';
                    
                    // Mostrar mensaje de bienvenida
                    showToast(`Bienvenido de nuevo, ${user.name}!`);

                    // Redirigir al inicio
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
        
        // Función para cerrar sesión
        function customerLogout() {
            currentUser = null;
            localStorage.removeItem('currentUser');
            updateAuthLinks();
            showToast('Has cerrado sesión correctamente');
            showSection('home');
        }
        
        // Función para actualizar el perfil
        async function updateProfile() {
            const name = document.getElementById('profile-name').value.trim();
            const phone = document.getElementById('profile-phone').value.trim();
            const address = document.getElementById('profile-address').value.trim();
            const errorEl = document.getElementById('profile-error');
            
            // Validar campos
            if (!name || !phone || !address) {
                errorEl.textContent = 'Todos los campos son obligatorios';
                errorEl.style.display = 'block';
                return;
            }
            
            try {
                // Obtener usuarios
                const users = await fetchUsers();
                
                // Buscar usuario actual
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                
                if (userIndex !== -1) {
                    // Actualizar datos del usuario
                    users[userIndex].name = name;
                    users[userIndex].phone = phone;
                    users[userIndex].address = address;
                    
                    // Guardar en la nube
                    await saveUsersToCloud(users);
                    
                    // Actualizar usuario en localStorage
                    currentUser = users[userIndex];
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Mostrar mensaje de éxito
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
        
        // Función para cambiar contraseña
        async function changePassword() {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorEl = document.getElementById('password-error');
            
            // Validar campos
            if (!currentPassword || !newPassword || !confirmPassword) {
                errorEl.textContent = 'Todos los campos son obligatorios';
                errorEl.style.display = 'block';
                return;
            }
            
            // Validar que la nueva contraseña coincida
            if (newPassword !== confirmPassword) {
                errorEl.textContent = 'Las contraseñas no coinciden';
                errorEl.style.display = 'block';
                return;
            }
            
            // Validar que la nueva contraseña sea diferente
            if (currentPassword === newPassword) {
                errorEl.textContent = 'La nueva contraseña debe ser diferente a la actual';
                errorEl.style.display = 'block';
                return;
            }
            
            try {
                // Obtener usuarios
                const users = await fetchUsers();
                
                // Buscar usuario actual
                const userIndex = users.findIndex(u => u.id === currentUser.id);
                
                if (userIndex !== -1) {
                    // Verificar contraseña actual
                    if (decryptData(users[userIndex].password) !== currentPassword) {
                        errorEl.textContent = 'Contraseña actual incorrecta';
                        errorEl.style.display = 'block';
                        return;
                    }
                    
                    // Actualizar contraseña
                    users[userIndex].password = encryptData(newPassword);
                    
                    // Guardar en la nube
                    await saveUsersToCloud(users);
                    
                    // Actualizar usuario en localStorage
                    currentUser = users[userIndex];
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Limpiar campos
                    document.getElementById('current-password').value = '';
                    document.getElementById('new-password').value = '';
                    document.getElementById('confirm-password').value = '';
                    
                    // Mostrar mensaje de éxito
                    showToast('Contraseña cambiada correctamente');
                    errorEl.style.display = 'none';
                } else {
                    errorEl.textContent = 'Usuario no encontrado';
                    errorEl.style.display = 'block';
                }
            } catch (error) {
                console.error('Error al cambiar contraseña:', error);
                errorEl.textContent = 'Hubo un error al cambiar la contraseña. Inténtalo de nuevo.';
                errorEl.style.display = 'block';
            }
        }
        
        // Función para verificar usuario antes de cambiar contraseña
        async function verifyUser() {
            const name = document.getElementById('recovery-name').value.trim();
            const email = document.getElementById('recovery-email').value.trim();
            const errorEl = document.getElementById('recovery-error');
            
            // Validar campos
            if (!name || !email) {
                errorEl.textContent = 'Por favor completa todos los campos';
                errorEl.style.display = 'block';
                return;
            }
            
            // Validar formato de email
            if (!isValidEmail(email)) {
                errorEl.textContent = 'Por favor ingresa un correo válido';
                errorEl.style.display = 'block';
                return;
            }
            
            try {
                // Obtener usuarios
                const users = await fetchUsers();
                
                // Buscar usuario por nombre y correo
                const user = users.find(u => u.name === name && u.email === email);
                
                if (user) {
                    // Guardar temporalmente el ID del usuario
                    sessionStorage.setItem('recoveryUserId', user.id);
                    
                    // Mostrar sección de nueva contraseña
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
        
        // Función para actualizar la contraseña después de verificar
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
                // Obtener usuarios
                const users = await fetchUsers();
                
                // Buscar usuario
                const userIndex = users.findIndex(u => u.id == userId);
                
                if (userIndex !== -1) {
                    // Actualizar contraseña
                    users[userIndex].password = encryptData(newPassword);
                    
                    // Guardar en la nube
                    await saveUsersToCloud(users);
                    
                    // Limpiar sesión
                    sessionStorage.removeItem('recoveryUserId');
                    
                    // Mostrar mensaje de éxito
                    showToast('Contraseña actualizada correctamente. Ahora puedes iniciar sesión.');

                    // Redirigir al login
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
        
        // Función para actualizar enlaces de autenticación
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
        
        // Función para cargar los pedidos del usuario
        async function loadUserOrders() {

            const container = document.getElementById('user-orders');
            // Solo cargar si la sección está visible
            if (container.closest('.profile-section').style.display !== 'none') {

                const container = document.getElementById('user-orders');
                container.innerHTML = '<p>Cargando pedidos...</p>';
                
                try {
                    // Obtener todos los pedidos
                    const orders = await fetchOrders();
                    
                    // Filtrar pedidos del usuario actual
                    const userOrders = orders.filter(order => order.userId == currentUser.id);
                    
                    if (userOrders.length === 0) {
                        container.innerHTML = '<p>No has realizado ningún pedido aún.</p>';
                        return;
                    }
                    
                    // Ordenar pedidos por fecha (más recientes primero)
                    userOrders.sort((a, b) => b.timestamp - a.timestamp);
                    
                    let ordersHTML = '';
                    userOrders.forEach(order => {
                        // Determinar clase CSS según estado
                        let statusClass = 'order-status ';
                        switch(order.status) {
                            case 'Pendiente':
                                statusClass += 'status-pendiente';
                                break;
                            case 'Aceptado':
                                statusClass += 'status-aceptado';
                                break;
                            case 'Completado':
                                statusClass += 'status-completado';
                                break;
                            case 'Rechazado':
                                statusClass += 'status-rechazado';
                                break;
                            default:
                                statusClass += 'status-pendiente';
                        }
                        
                        // Generar lista de productos
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

        // ======== FUNCIONES DE PEDIDOS ======== //
        
        // Función para obtener los pedidos desde la nube
        async function fetchOrders() {
            try {
                const response = await fetch(`${API_URL}${BIN_ID}`, {
                    method: 'GET',
                    headers: {
                        'X-Master-Key': MASTER_KEY,
                        'X-Bin-Meta': 'false' // Solo obtenemos el contenido, sin metadatos
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`Error en la solicitud: ${response.status}`);
                }
                
                const data = await response.json();
                return data.orders || []; // Retornamos el array de pedidos
            } catch (error) {
                console.error('Error al obtener pedidos:', error);
                return [];
            }
        }
        
        // Función para guardar pedidos en la nube
        async function saveOrdersToCloud(orders) {
            try {
                const response = await fetch(`${API_URL}${BIN_ID}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': MASTER_KEY
                    },
                    body: JSON.stringify({ orders }) // Enviamos como objeto {orders: [...]}
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

        // Función para guardar el pedido
        async function saveOrder() {
            // Obtener datos del cliente
            const name = document.getElementById('customer-name').value.trim();
            const address = document.getElementById('customer-address').value.trim();
            const phone = document.getElementById('customer-phone').value.trim();
            const notes = document.getElementById('customer-notes').value.trim();
            
            // Calcular totales
            let subtotal = 0;
            cart.forEach(item => {
                subtotal += 1;
            });
            const total = subtotal;
            
            // Crear objeto de pedido
            const now = new Date();
            const order = {
                id: Date.now(), // Usamos la marca de tiempo como ID único
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
                status: 'Pendiente', // Estado inicial
                items: cart.map(item => ({
                    name: item.name,
                    unit: item.unit,
                    quantity: item.quantity
                })),
                total: total,
                timestamp: now.getTime(), // Guardamos timestamp para filtrado
                userId: currentUser.id // Asociar pedido con usuario
            };

            // Calcular totales
            let productsList = [];
            
            let subtotal2 = 0;
            cart.forEach(item => {
                subtotal2 += 1;
            });
            const total2 = subtotal2;

            cart.forEach(item => {
                // Guardar detalles del producto
                productsList.push({
                    name: item.name,
                    unit: item.unit,
                    quantity: item.quantity,
                    total: total2
                });
            });
            
            try {
                // Obtener pedidos existentes
                const existingOrders = await fetchOrders();
                existingOrders.push(order);
                
                // Guardar en la nube
                await saveOrdersToCloud(existingOrders);
                
                // Vaciar el carrito
                cart = [];
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();
                updateCartView();
                
                // Mostrar notificación
                showToast('¡Pedido enviado con éxito! Nuestro equipo lo procesará pronto.');
                
                // Volver a la página de inicio
                showSection('home');
            } catch (error) {
                console.error('Error al guardar el pedido:', error);
                showToast('Hubo un error al procesar tu pedido. Por favor, inténtalo de nuevo.');
            }
        }

        // Función para cambiar entre pestañas
        function showProfileTab(tabId) {
            // Ocultar todas las secciones
            document.querySelectorAll('.profile-section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Quitar clase activa de todos los botones
            document.querySelectorAll('.profile-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // Mostrar sección seleccionada
            document.getElementById(tabId).style.display = 'block';
            
            // Marcar botón como activo
            event.currentTarget.classList.add('active');
            
            // Si es la sección de pedidos, cargarlos
            if (tabId === 'order-history') {
                loadUserOrders();
            }
        }

// Función para buscar productos (muestra productos directamente)
        function searchProducts() {
            const searchTerm = document.getElementById('search-input').value.toLowerCase();
            const allProducts = products; // Todos los productos
            
            // Obtener contenedores
            const categoriesContainer = document.getElementById('categories-container');
            const productsContainer = document.getElementById('search-products-container');
            
            // Mostrar contenedor de resultados de búsqueda
            productsContainer.style.display = 'grid';
            categoriesContainer.style.display = 'none';
            
            // Limpiar resultados anteriores
            productsContainer.innerHTML = '';
            
            if (!searchTerm) {
                // Si no hay término, mostrar categorías
                productsContainer.style.display = 'none';
                categoriesContainer.style.display = 'grid';
                return;
            }
            
            // Filtrar productos que coincidan
            const filteredProducts = allProducts.filter(product => 
                product.name.toLowerCase().includes(searchTerm) && product.visible
            );
            
            if (filteredProducts.length === 0) {
                productsContainer.innerHTML = '<p style="text-align: center; padding: 2rem; grid-column: 1 / -1;">No se encontraron productos</p>';
                return;
            }
            
            // Mostrar productos encontrados
            filteredProducts.forEach(product => {
                // Generar opciones según unidad (igual que en showCategory)
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <img src="${product.image}" alt="${product.name}" class="product-image">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p>Cantidad:</p>
                        <div class="product-actions">
                            <select class="quantity-select" id="quantity-${product.id}">
                                ${getQuantityOptions(product.unit)}
                            </select>
                            <button class="add-to-cart" onclick="addToCart(${product.id})">
                                <i class="fas fa-cart-plus"></i> Agregar
                            </button>
                        </div>
                    </div>
                `;
                productsContainer.appendChild(productCard);
            });
        }

        // Función para limpiar búsqueda
        function clearSearch() {
            document.getElementById('search-input').value = '';
            document.getElementById('search-products-container').style.display = 'none';
            document.getElementById('categories-container').style.display = 'grid';
        }

        // Inicializar contador del carrito y enlaces de autenticación
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
            
            /*const sectionToLoad = loadSavedSection();
            showSection(sectionToLoad);*/
        });

        /*function loadSavedSection() {
            const savedSection = localStorage.getItem('activeSection');
            const mainSections = ['home', 'store', 'cart', 'login', 'signup', 'profile'];
            
            // Si es la primera carga o no hay sección válida guardada
            if (!savedSection || !mainSections.includes(savedSection)) {
                return 'home'; // Sección por defecto
            }
            
            // Validar si se puede mostrar el perfil (requiere usuario logueado)
            if (savedSection === 'profile' && !currentUser) {
                return 'home';
            }
            
            return savedSection;
        }*/
