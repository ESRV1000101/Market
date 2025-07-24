// Credenciales API
const MASTER_KEY = '$2a$10$CfialwaKlt.oEV.qHo/IHeu2aUczMtpVkCYXzMgUtZCpjmNU9pIGK';
const BIN_ID = '687a974a2de0201b319ca267';
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const USERS_BIN_ID = '687b046c2de0201b319ccf2b'; // Nuevo bin para usuarios
const CATEGORIES_BIN_ID = '687f2380ae596e708fb99af7';
const PRODUCTS_BIN_ID = '687f2362f7e7a370d1ebcc73';
const CATEGORIES_API_URL = `https://api.jsonbin.io/v3/b/${CATEGORIES_BIN_ID}`;
const PRODUCTS_API_URL = `https://api.jsonbin.io/v3/b/${PRODUCTS_BIN_ID}`;

// Credenciales de administrador
const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "nomura25"; 

// Agrega estas constantes al inicio del archivo admin.js
const CLOUDINARY_CLOUD_NAME = 'dgxjjabov'; // Reemplaza con tu cloud name
const CLOUDINARY_UPLOAD_PRESET = 'yufoods_preset'; // Nombre que creaste

// Estado global
let ordersChart = null;
let currentOrders = [];
let currentOrderDetailsId = null;
let orderHistoryMap = {}; // Historial de cambios de estado (solo en memoria)

// Paginación: variables de estado
let ordersCurrentPage = 1;
const ordersPageSize = 10; // Cambia este valor para más/menos filas por página

// Toast notifications
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

// Función para iniciar sesión
function login() {
    const user = document.getElementById('admin-user').value;
    const password = document.getElementById('admin-password').value;
    const errorMessage = document.getElementById('login-error');
    
    if (user === ADMIN_USER && password === ADMIN_PASSWORD) {
        localStorage.setItem('adminLoggedIn', 'true');
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        loadOrders();  // Cargar pedidos automáticamente al iniciar
    } else {
        errorMessage.style.display = 'block';
        showToast('Credenciales incorrectas', 'error');
    }

    if (valid) {
        localStorage.setItem('adminLoggedIn', 'true');
        saveActiveSection('admin-panel'); // Siempre inicia en panel admin después de login
        showActiveSection();
    }
}

// Función para cerrar sesión
function logout() {
    localStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('activeSection'); // Limpiar sección activa al salir
    location.reload();
}

// Comprobar si el administrador ya está logueado
function checkLogin() {
    if (localStorage.getItem('adminLoggedIn') === 'true') {
        showActiveSection();
    }
}

// Función para mostrar loader
function showLoader() {
    document.getElementById('admin-loader').style.display = 'block';
    document.getElementById('stats-container').style.display = 'none';
    document.getElementById('chart-container').style.display = 'none';
    document.getElementById('orders-body').innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Cargando pedidos...</td></tr>';
    document.getElementById('empty-orders').style.display = 'none';
    
    // Cerrar detalles si estaban abiertos
    closeOrderDetails();
}

// Función para ocultar loader
function hideLoader() {
    document.getElementById('admin-loader').style.display = 'none';
    document.getElementById('stats-container').style.display = 'block';
    document.getElementById('chart-container').style.display = 'block';
}

// Función para obtener los pedidos desde la nube
async function fetchOrders() {
    try {
        const response = await fetch(API_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': MASTER_KEY,
                'X-Bin-Meta': 'false'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener los pedidos');
        }

        const binData = await response.json();
        return binData.orders || [];
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        showToast('Error al cargar los pedidos. Inténtalo de nuevo más tarde.');
        return [];
    }
}

// Función para guardar pedidos en la nube
async function saveOrdersToCloud(orders) {
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: {
                'X-Master-Key': MASTER_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orders })
        });

        if (!response.ok) {
            throw new Error('Error al guardar los pedidos');
        }

        return await response.json();
    } catch (error) {
        showToast('Error al guardar pedidos', 'error');
        throw error;
    }
}

// Función para cargar pedidos filtrados (con filtro de estado)
async function loadFilteredOrders() {
    showLoader();
    
    try {
        const orders = await fetchOrders();
        const startDateInput = document.getElementById('filter-start-date').value;
        const endDateInput = document.getElementById('filter-end-date').value;
        const statusFilter = document.getElementById('filter-status').value;

        /*// Filtrar pedidos por fecha y estado anterior
        let filteredOrders = orders;

        // Filtro por fechas usando timestamp
        if (startDateInput) {
            const startDate = new Date(startDateInput).getTime();
            filteredOrders = filteredOrders.filter(order => order.timestamp >= startDate);
        }

        if (endDateInput) {
            const endDate = new Date(endDateInput).getTime() + 86399999; // 23:59:59.999
            filteredOrders = filteredOrders.filter(order => order.timestamp <= endDate);
        }

        if (statusFilter) {
            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }*/
            
        // Filtrar pedidos por fecha y estado
        let filteredOrders = orders;

        /* filtro version 2
        if (startDateInput) {
            // Ajuste: Incluir hora 00:00:00 del día seleccionado
            const startDate = new Date(startDateInput);
            startDate.setHours(0, 0, 0, 0);
            filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        return orderDate >= startDate;
            });
        }

        if (endDateInput) {
            // Ajuste: Incluir hora 23:59:59 del día seleccionado
            const endDate = new Date(endDateInput);
            endDate.setHours(23, 59, 59, 999);
            filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.timestamp);
        return orderDate <= endDate;
            });
        }*/

        if (startDateInput || endDateInput) {
            filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.timestamp);

        if (startDateInput && endDateInput) {
            const startDate = new Date(startDateInput);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(endDateInput);
            endDate.setHours(23, 59, 59, 999);
            return orderDate >= startDate && orderDate <= endDate;
        } else if (startDateInput) {
            const startDate = new Date(startDateInput);
            startDate.setHours(0, 0, 0, 0);
            return orderDate >= startDate;
        } else if (endDateInput) {
            const endDate = new Date(endDateInput);
            endDate.setHours(23, 59, 59, 999);
            return orderDate <= endDate;
        }
        return true;
            });
        }

        // Filtrado por estado
        if (statusFilter) {
            filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
        }

        currentOrders = filteredOrders;
        renderOrders(filteredOrders);
        updateStats(filteredOrders);
        createOrdersChart(filteredOrders);
        loadProductsReport(); // Actualizar reporte de productos
        hideLoader();

        document.getElementById('download-excel-btn').style.display = 
            filteredOrders.length > 0 ? 'inline-block' : 'none';
            
        document.getElementById('orders-count').innerHTML = `
            <span style="background: var(--accent); padding: 4px 8px; border-radius: 20px;">
        ${filteredOrders.length} pedidos encontrados
            </span>
        `;
            
        if (filteredOrders.length === 0) {
            document.getElementById('empty-orders').style.display = 'block';
        } else {
            document.getElementById('empty-orders').style.display = 'none';
        }
    
    } catch (error) {
        console.error('Error al cargar pedidos filtrados:', error);
        hideLoader();
    }
}

// Función para renderizar pedidos en la tabla
function renderOrders(orders) {
    const tbody = document.getElementById('orders-body');
    tbody.innerHTML = '';
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">No se encontraron pedidos</td></tr>';
        document.getElementById('orders-pagination').innerHTML = '';
        return;
    }
    // Ordenar pedidos por fecha (más recientes primero)
    orders.sort((a, b) => b.timestamp - a.timestamp);
    
    // Paginación
    const totalPages = Math.ceil(orders.length / ordersPageSize);
    if (ordersCurrentPage > totalPages) ordersCurrentPage = totalPages || 1;
    const startIdx = (ordersCurrentPage - 1) * ordersPageSize;
    const endIdx = startIdx + ordersPageSize;
    const pageOrders = orders.slice(startIdx, endIdx);

    pageOrders.forEach(order => {
        // Determinar clase CSS según estado
        let statusClass = 'order-status ';
        switch(order.status) {
            case 'Pendiente': statusClass += 'status-pendiente'; break;
            case 'Aceptado': statusClass += 'status-aceptado'; break;
            case 'Completado': statusClass += 'status-completado'; break;
            case 'Rechazado': statusClass += 'status-rechazado'; break;
            default: statusClass += 'status-pendiente';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.date}</td>
            <td>${order.customer}</td>
            <td>${order.total}</td>
            <td><span class="${statusClass}">${order.status}</span></td>
            <td>
            <select class="form-input" id="status-${order.id}">
                <option value="Pendiente" ${order.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="Aceptado" ${order.status === 'Aceptado' ? 'selected' : ''}>Aceptado</option>
                <option value="Completado" ${order.status === 'Completado' ? 'selected' : ''}>Completado</option>
                <option value="Rechazado" ${order.status === 'Rechazado' ? 'selected' : ''}>Rechazado</option>
            </select>
                </td>
                <td>
            <button class="action-btn" onclick="viewOrderDetails(${order.id})" aria-label="Ver detalles del pedido">
                <i class="fas fa-eye"></i> Ver
            </button>
            <button class="action-btn" onclick="saveOrderStatus(${order.id})" aria-label="Guardar estado del pedido">
                <i class="fas fa-save"></i> Guardar
            </button>
            <button class="action-btn" onclick="deleteOrder(${order.id})" aria-label="Eliminar pedido">
                <i class="fas fa-trash"></i>
            </button>
            <button class="action-btn" onclick="showOrderHistory(${order.id})" aria-label="Ver historial de cambios">
                <i class="fas fa-history"></i>
            </button>
                </td>
            `;
        tbody.appendChild(row);
    });

    renderOrdersPagination(orders.length, ordersCurrentPage, ordersPageSize);
}

// Renderizar controles de paginación
function renderOrdersPagination(totalItems, currentPage, pageSize) {
    const container = document.getElementById('orders-pagination');
    const totalPages = Math.ceil(totalItems / pageSize);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    html += `<button class="pagination-btn" onclick="goToOrdersPage(1)" ${currentPage === 1 ? 'disabled' : ''}>&laquo;</button>`;
    html += `<button class="pagination-btn" onclick="goToOrdersPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&lsaquo;</button>`;
    
    // Mostrar máximo 5 páginas alrededor de la actual
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, currentPage + 2);
    
    if (currentPage <= 3) end = Math.min(5, totalPages);
    if (currentPage >= totalPages - 2) start = Math.max(1, totalPages - 4);
    
    for (let i = start; i <= end; i++) {
        html += `<button class="pagination-btn${i === currentPage ? ' active' : ''}" onclick="goToOrdersPage(${i})">${i}</button>`;
    }
    
    html += `<button class="pagination-btn" onclick="goToOrdersPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>&rsaquo;</button>`;
    html += `<button class="pagination-btn" onclick="goToOrdersPage(${totalPages})" ${currentPage === totalPages ? 'disabled' : ''}>&raquo;</button>`;
    container.innerHTML = html;
}

// Cambiar de página
function goToOrdersPage(page) {
    ordersCurrentPage = page;
    renderOrders(currentOrders);
}

// Función para guardar el estado de un pedido
async function saveOrderStatus(orderId) {
    const statusSelect = document.getElementById(`status-${orderId}`);
    const newStatus = statusSelect.value;
    try {
        const orders = await fetchOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            // Guardar historial de cambios (solo en memoria)
            if (!orderHistoryMap[orderId]) orderHistoryMap[orderId] = [];
            orderHistoryMap[orderId].push({
                status: orders[orderIndex].status,
                changedAt: new Date().toLocaleString()
            });
            orders[orderIndex].status = newStatus;
            await saveOrdersToCloud(orders);
            loadFilteredOrders();
            showToast(`El estado del pedido #${orderId} ha sido actualizado a "${newStatus}"`, 'success');
        }
    } catch (error) {
        showToast('Hubo un error al actualizar el estado del pedido', 'error');
    }
}

// Eliminar pedido con confirmación
async function deleteOrder(orderId) {
    if (!confirm(`¿Seguro que deseas eliminar el pedido #${orderId}? Esta acción no se puede deshacer.`)) return;
    try {
        const orders = await fetchOrders();
        const newOrders = orders.filter(o => o.id !== orderId);
        await saveOrdersToCloud(newOrders);
        loadFilteredOrders();
        showToast(`Pedido #${orderId} eliminado`, 'success');
    } catch (error) {
        showToast('Error al eliminar el pedido', 'error');
    }
}

// Mostrar historial de cambios de estado
function showOrderHistory(orderId) {
    const history = orderHistoryMap[orderId] || [];
    if (history.length === 0) {
        showToast('No hay historial para este pedido', 'info');
        return;
    }
    let msg = `Historial de cambios para pedido #${orderId}:\n`;
    history.forEach(h => {
        msg += `- ${h.status} (${h.changedAt})\n`;
    });
    showToast(msg);
}

// Función para ver detalles de un pedido
async function viewOrderDetails(orderId) {
    // Si ya está abierto este pedido, cerrarlo
    if (currentOrderDetailsId === orderId) {
        closeOrderDetails();
        return;
    }
    
    const orders = await fetchOrders();
    const order = orders.find(o => o.id === orderId);
    
    if (!order) return;
    
    const detailsContent = document.getElementById('order-details-content');
    detailsContent.innerHTML = `
        <h3>Detalles del Pedido #${order.id}</h3>

        <div>
            <p><strong>Fecha:</strong> ${order.date}</p>
            <p><strong>Cliente:</strong> ${order.customer}</p>
            <p><strong>Dirección:</strong> ${order.address}</p>
            <p><strong>Teléfono:</strong> ${order.phone || 'No especificado'}</p>
            <p><strong>Notas:</strong> ${order.notes || 'Ninguna'}</p>
            <p><strong>Estado:</strong> <span class="order-status status-${order.status.toLowerCase()}">${order.status}</span></p>
            <p><strong>ID Usuario:</strong> ${order.userId || 'No registrado'}</p>
        </div>

        <h4 style="margin-top: 1.5rem;">Productos:</h4>
        <div class="order-items">
            ${order.items.map(item => `
        <div class="order-item">
            <span>${item.name}</span>
            <span> -- </span>
            <span>Cantidad: ${item.quantity} (${item.unit})</span>
        </div>
            `).join('')}
        </div>
            `;
    
    // Mostrar modal
    document.getElementById('order-details-modal').classList.add('active');
    currentOrderDetailsId = orderId;
}

// Función para cerrar detalles del pedido
function closeOrderDetails() {
    document.getElementById('order-details-modal').classList.remove('active');
    currentOrderDetailsId = null;
}

// Función para crear gráfico de pedidos
function createOrdersChart(orders) {
    const ctx = document.getElementById('orders-chart').getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (ordersChart) {
        ordersChart.destroy();
    }
    
    if (orders.length === 0) {
        // Mostrar mensaje de no datos
        ctx.fillStyle = "#999";
        ctx.font = "16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("No hay datos para mostrar", ctx.canvas.width/2, ctx.canvas.height/2);
        return;
    }
    
    // Agrupar pedidos por día
    const ordersByDay = {};
    orders.forEach(order => {
        const date = new Date(order.timestamp);
        const dayKey = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

        if (!ordersByDay[dayKey]) {
            ordersByDay[dayKey] = 0;
        }
        ordersByDay[dayKey]++;
    });
    
    // Ordenar por fecha
    const sortedDays = Object.keys(ordersByDay).sort((a, b) => {
        const [aDay, aMonth, aYear] = a.split('/').map(Number);
        const [bDay, bMonth, bYear] = b.split('/').map(Number);
        return new Date(aYear, aMonth - 1, aDay) - new Date(bYear, bMonth - 1, bDay);
    });
    
    // Preparar datos para el gráfico
    const labels = sortedDays;
    const data = sortedDays.map(day => ordersByDay[day]);
    
    // Crear gráfico
    ordersChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pedidos por día',
                data: data,
                backgroundColor: 'rgba(74, 124, 89, 0.7)',
                borderColor: 'rgba(74, 124, 89, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Actualizar estadísticas
function updateStats(orders) {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'Pendiente').length;
    const acceptedOrders = orders.filter(order => order.status === 'Aceptado').length;
    const completedOrders = orders.filter(order => order.status === 'Completado').length;
    const rejectedOrders = orders.filter(order => order.status === 'Rechazado').length;
    
    // Actualizar elementos específicos
    document.getElementById('stat-total').textContent = totalOrders;
    document.getElementById('stat-pending').textContent = pendingOrders;
    document.getElementById('stat-accepted').textContent = acceptedOrders;
    document.getElementById('stat-completed').textContent = completedOrders;
    document.getElementById('stat-rejected').textContent = rejectedOrders;
}

// Función para aplicar filtro por fecha
function applyDateFilter() {
    loadFilteredOrders();
}

// Función para limpiar filtro de fecha
function clearDateFilter() {
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    document.getElementById('filter-status').value = '';
    loadFilteredOrders(); // Cargar todos los pedidos
}

// Función para refrescar la lista de pedidos
function refreshOrders() {
    if (document.getElementById('filter-start-date').value || 
        document.getElementById('filter-end-date').value ||
        document.getElementById('filter-status').value) {
        loadFilteredOrders();
    } else {
        loadOrders(); // Cargar todos los pedidos
    }
}

// Mostrar la pestaña seleccionada
function showStatsTab(tabId) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.stats-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Quitar clase activa de todos los botones
    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    document.getElementById(tabId).classList.add('active');
    
    // Marcar botón como activo
    event.currentTarget.classList.add('active');
    
    // Si es la pestaña de productos, cargar el reporte
    if (tabId === 'products-report') {
        loadProductsReport();
    }
}

// Función para cargar el reporte de productos
async function loadProductsReport() {
    // Usar el filtro principal de fechas
    const startDateInput = document.getElementById('filter-start-date').value;
    const endDateInput = document.getElementById('filter-end-date').value;
    const container = document.getElementById('products-report-content');
    
    container.innerHTML = '<p>Cargando reporte de productos...</p>';
    
    try {
        const orders = await fetchOrders();

        // Filtrar solo pedidos aceptados
        let acceptedOrders = orders.filter(order => order.status === 'Aceptado');

        // Filtrar por fecha si se ha seleccionado
        if (startDateInput) {
            const startDate = new Date(startDateInput).getTime();
            acceptedOrders = acceptedOrders.filter(order => order.timestamp >= startDate);
        }

        if (endDateInput) {
            const endDate = new Date(endDateInput).getTime() + 86399999; // 23:59:59.999
            acceptedOrders = acceptedOrders.filter(order => order.timestamp <= endDate);
        }

        // Calcular el reporte de productos
        const productSummary = {};

        acceptedOrders.forEach(order => {
            order.items.forEach(item => {
        const key = `${item.name}-${item.unit}`;
        if (!productSummary[key]) {
            productSummary[key] = {
        name: item.name,
        unit: item.unit,
        quantity: 0
            };
        }
        productSummary[key].quantity += item.quantity;
            });
        });

        // Convertir a array y ordenar por cantidad (mayor primero)
        const reportData = Object.values(productSummary);
        reportData.sort((a, b) => b.quantity - a.quantity);

        // Generar HTML del reporte
        if (reportData.length === 0) {
            container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-box-open"></i>
            <h3>No hay productos para mostrar</h3>
            <p>No se encontraron productos en pedidos aceptados con los filtros seleccionados</p>
        </div>
            `;
            return;
        }

        let reportHTML = `
            <div style="overflow-x: auto;">
                <table class="orders-table">
                    <thead>
                <tr>
                    <th>Producto</th>
                    <th>Unidad</th>
                    <th>Cantidad Total</th>
                </tr>
                    </thead>
                    <tbody>
        `;

        reportData.forEach(item => {
            reportHTML += `
            <tr>
                <td>${item.name}</td>
                <td>${item.unit}</td>
                <td>${item.quantity.toFixed(2)}</td>
            </tr>
                `;
        });

        reportHTML += `
                </tbody>
            </table>
        </div>
            
        <div style="margin-top: 1.5rem; text-align: center;">
            <p>Total de productos distintos: ${reportData.length}</p>
            <p>Total de pedidos aceptados: ${acceptedOrders.length}</p>
        </div>
        `;

        container.innerHTML = reportHTML;

    } catch (error) {
        console.error('Error al cargar el reporte de productos:', error);
        container.innerHTML = '<p>Error al cargar el reporte. Inténtalo de nuevo.</p>';
    }
}

// Función para limpiar filtros de reporte
/*function clearReportFilter() {
    document.getElementById('report-start-date').value = '';
    document.getElementById('report-end-date').value = '';
    loadProductsReport();
}*/

// Cargar los pedidos
async function loadOrders() {
    // Solo cargar si estamos en el panel de admin
    if (document.getElementById('admin-panel').style.display === 'block') {
        showLoader();
        
        try {
            const orders = await fetchOrders();
            currentOrders = orders;
            renderOrders(orders);
            updateStats(orders);
            createOrdersChart(orders);
            loadProductsReport(); // Cargar reporte de productos
            hideLoader();

            if (orders.length > 0) {
                document.getElementById('download-excel-btn').style.display = 'inline-block';
            } else {
                document.getElementById('empty-orders').style.display = 'block';
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            hideLoader();
        }
    }
}

// Función para descargar reporte en Excel de pedidos pendientes
function downloadExcel() {
    // Filtrar solo pedidos aceptados
    const acceptedOrders = currentOrders.filter(order => order.status === 'Aceptado');
    
    if (acceptedOrders.length === 0) {
        alert('No hay pedidos aceptados para exportar');
        return;
    }
    
    // 1. Hoja de resumen de productos
    const productSummary = {};
    
    // Calcular totales por producto
    acceptedOrders.forEach(order => {
        order.items.forEach(item => {
            if (!productSummary[item.name]) {
        productSummary[item.name] = {
            quantity: 0,
            unit: item.unit || 'unidad'
        };
            }
            productSummary[item.name].quantity += item.quantity;
        });
    });
    
    // Convertir a array para Excel
    const summaryData = [
        ['RESUMEN DE PRODUCTOS ACEPTADOS', '', '', '', '', ''],
        ['Producto', 'Unidad', 'Cantidad Total', '', '', ''],
    ];
    
    for (const [product, data] of Object.entries(productSummary)) {
        summaryData.push([product, data.unit, data.quantity]);
    }
    
    // 2. Crear libro de Excel
    const workbook = XLSX.utils.book_new();
    
    // Hoja de resumen con formato
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Aplicar estilos a la hoja de resumen
    const summaryRange = XLSX.utils.decode_range(summarySheet['!ref']);
    
    // Estilo para el título
    for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!summarySheet[cellAddress]) continue;

        summarySheet[cellAddress].s = {
            font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4A7C59" } },
            alignment: { horizontal: "center" }
        };
    }
    
    // Estilo para encabezados de columna
    for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 1, c: col });
        if (!summarySheet[cellAddress]) continue;

        summarySheet[cellAddress].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "8d9f87" } },
            alignment: {horizontal: 'center'}
        };
    }
    
    // Estilo para datos
    for (let row = 2; row <= summaryRange.e.r; row++) {
        for (let col = summaryRange.s.c; col <= summaryRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!summarySheet[cellAddress]) continue;
            
            summarySheet[cellAddress].s = {
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                },
                alignment: {horizontal: 'center'}
            };
        
            // Alternar colores de fila
            if (row % 2 === 0) {
                summarySheet[cellAddress].s.fill = { fgColor: { rgb: "F4F1E9" } };
            }
        }
    }
    
    // Unir celdas para el título
    summarySheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];
    
    // Ajustar anchos de columna
    summarySheet['!cols'] = [
        { wch: 30 },  // Producto
        { wch: 10 },  // Unidad
        { wch: 15 },  // Cantidad Total
        { wch: 5 },
        { wch: 5 },
        { wch: 5 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");
    
    // 3. Hojas para cada pedido
    acceptedOrders.forEach(order => {
        const orderData = [
            [`PEDIDO #${order.id} - ${order.customer}`, '', '', '', '', ''],
            ['Fecha:', order.date, '', '', '', ''],
            ['Dirección:', order.address, '', '', '', ''],
            ['Teléfono:', order.phone || 'No especificado', '', '', '', ''],
            ['Notas:', order.notes || 'Ninguna', '', '', '', ''],
            ['Estado:', order.status, '', '', '', ''],
            ['ID Usuario:', order.userId || 'No registrado', '', '', '', ''],
            ['', '', '', '', '', ''],
            ['Producto', 'Unidad', 'Cantidad', '', '', ''],
        ];

        // Agregar productos
        order.items.forEach(item => {
            orderData.push([
        item.name, 
        item.unit || 'unidad', 
        item.quantity
            ]);
        });

        // Agregar total
        orderData.push(['', '', '', '', '', '']);
        orderData.push(['Total de productos distintos:', '', order.items.length]);

        // Crear hoja
        const orderSheet = XLSX.utils.aoa_to_sheet(orderData);

        // Aplicar estilos
        const orderRange = XLSX.utils.decode_range(orderSheet['!ref']);

        // Estilo para título del pedido
        for (let col = orderRange.s.c; col <= orderRange.e.c; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!orderSheet[cellAddress]) continue;
            
            orderSheet[cellAddress].s = {
        font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4A7C59" } },
        alignment: {horizontal: 'center'}
            };
        }

        // Estilo para encabezados de información
        for (let row = 1; row <= 7; row++) {
            for (let col = 0; col <= 1; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!orderSheet[cellAddress]) continue;

        if (col === 0) {
            orderSheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "F4F1E9" } },
        alignment: {horizontal: 'center'}
            };
        }
            }
        }

        // Estilo para encabezado de productos
        for (let col = 0; col <= 2; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 8, c: col });
            if (!orderSheet[cellAddress]) continue;
            
            orderSheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "8d9f87" } },
        alignment: {horizontal: 'center'}
            };
        }

        // Estilo para total
        const totalRow = orderRange.e.r;
        for (let col = 0; col <= 2; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: totalRow, c: col });
            if (!orderSheet[cellAddress]) continue;
            
            orderSheet[cellAddress].s = {
        font: { bold: true },
        border: { top: { style: "medium", color: { rgb: "000000" } } },
        alignment: {horizontal: 'left'}
            };
        }

        // Unir celdas para el título
        orderSheet['!merges'] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }
        ];

        // Ajustar anchos de columna
        orderSheet['!cols'] = [
            { wch: 30 },  // Producto
            { wch: 20 },  // Unidad
            { wch: 15 },  // Cantidad
            { wch: 5 },
            { wch: 5 },
            { wch: 5 }
        ];

        XLSX.utils.book_append_sheet(workbook, orderSheet, `Pedido ${order.id}`);
    });
    
    // Descargar archivo
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Pedidos_Aceptados_${today}.xlsx`);
}

// Función para cambiar todos los pedidos pendientes a aceptados
async function acceptAllPending() {
    if (!confirm('¿Está seguro de cambiar todos los pedidos PENDIENTES a ACEPTADOS?')) {
        return;
    }
    
    try {
        const orders = await fetchOrders();
        let updated = false;

        const updatedOrders = orders.map(order => {
            if (order.status === 'Pendiente') {
                updated = true;
                return { ...order, status: 'Aceptado' };
            }
            return order;
        });

        if (!updated) {
            showToast('No hay pedidos pendientes para actualizar.');
            return;
        }

        await saveOrdersToCloud(updatedOrders);
        showToast('Todos los pedidos pendientes han sido aceptados.');
        loadFilteredOrders(); // Refresh the view
    } catch (error) {
        console.error('Error al actualizar pedidos:', error);
        showToast('Hubo un error al actualizar los pedidos.');
    }
}

// Función para cambiar todos los pedidos aceptados a completados
async function completeAllAccepted() {
    if (!confirm('¿Está seguro de cambiar todos los pedidos ACEPTADOS a COMPLETADOS?')) {
        return;
    }
    
    try {
        const orders = await fetchOrders();
        let updated = false;

        const updatedOrders = orders.map(order => {
            if (order.status === 'Aceptado') {
        updated = true;
        return { ...order, status: 'Completado' };
            }
        return order;
        });

        if (!updated) {
            showToast('No hay pedidos aceptados para actualizar.');
            return;
        }

        await saveOrdersToCloud(updatedOrders);
        showToast('Todos los pedidos aceptados han sido completados.');
        loadFilteredOrders(); // Refresh the view
    } catch (error) {
        console.error('Error al actualizar pedidos:', error);
        showToast('Hubo un error al actualizar los pedidos.');
    }
}

// Cerrar modal al hacer clic en el fondo
document.getElementById('order-details-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('order-details-modal')) {
        closeOrderDetails();
    }
});

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Limpiar sección activa si es una nueva sesión
    if (!sessionStorage.getItem('sessionStart')) {
        sessionStorage.setItem('sessionStart', 'true');
        sessionStorage.removeItem('activeSection');
    }
    
    checkLogin();
    // Permitir login con Enter
    document.getElementById('admin-user').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });

    document.getElementById('admin-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            login();
        }
    });

    setupModalClosers();
});

// ================== CATEGORÍAS Y PRODUCTOS ==================
// ================== FUNCIONES DE API PARA CATEGORÍAS Y PRODUCTOS ==================
async function fetchCategories() {
    try {
        const res = await fetch(CATEGORIES_API_URL, {
            method: 'GET',
            headers: { 'X-Master-Key': MASTER_KEY, 'X-Bin-Meta': 'false' }
        });
        if (!res.ok) throw new Error('Error al obtener categorías');
        const data = await res.json();
        return data.categories || [];
    } catch (e) {
        showToast('Error al cargar categorías', 'error');
        return [];
    }
}
async function saveCategoriesToCloud(categories) {
    try {
        const res = await fetch(CATEGORIES_API_URL, {
            method: 'PUT',
            headers: { 'X-Master-Key': MASTER_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ categories })
        });
        if (!res.ok) throw new Error('Error al guardar categorías');
        return await res.json();
    } catch (e) {
        showToast('Error al guardar categorías', 'error');
        throw e;
    }
}
async function fetchProducts() {
    try {
        const res = await fetch(PRODUCTS_API_URL, {
            method: 'GET',
            headers: { 'X-Master-Key': MASTER_KEY, 'X-Bin-Meta': 'false' }
        });
        if (!res.ok) throw new Error('Error al obtener productos');
        const data = await res.json();
        return data.products || [];
    } catch (e) {
        showToast('Error al cargar productos', 'error');
        return [];
    }
}
async function saveProductsToCloud(products) {
    try {
        const res = await fetch(PRODUCTS_API_URL, {
            method: 'PUT',
            headers: { 'X-Master-Key': MASTER_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ products })
        });
        if (!res.ok) throw new Error('Error al guardar productos');
        return await res.json();
    } catch (e) {
        showToast('Error al guardar productos', 'error');
        throw e;
    }
}

// ================== GESTIÓN DE TIENDA ==================
// Variables globales para editor
let editorCategories = [];
let editorProducts = [];
let editorSelectedCategoryId = null;
let currentEditItem = null;
let currentUploadType = null; // 'category' o 'product'

// Mostrar/ocultar editor
document.getElementById('edit-store-link').addEventListener('click', function(e) {
    e.preventDefault();
    saveActiveSection('store-editor');
    showActiveSection();
});

document.getElementById('back-to-admin-btn').addEventListener('click', function(e) {
    e.preventDefault();
    saveActiveSection('admin-panel');
    showActiveSection();
});

// Cargar datos de tienda
async function loadStoreEditor() {
    try {
        editorCategories = await fetchCategories();
        editorProducts = await fetchProducts();
        renderCategoriesEditor();
        renderProductsEditorCategorySelect();
        renderProductsEditor();

        // Configurar botones
        document.getElementById('add-category-btn').onclick = () => openEditorModal('category');
        document.getElementById('add-product-btn').onclick = () => openEditorModal('product');
    } catch (error) {
        showToast('Error al cargar editor: ' + error.message, 'error');
    }
}

// Renderizar categorías
function renderCategoriesEditor() {
    const container = document.getElementById('categories-editor-list');
    container.innerHTML = '';
    
    editorCategories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'editor-item';
        item.innerHTML = `
            <img src="${cat.image}" alt="${cat.name}">
            <div class="editor-item-info">
        <h4>${cat.name}</h4>
        <div>
            <label class="visibility-label">
        Visible al público:
        <label class="visibility-toggle">
            <input type="checkbox" ${cat.visible ? 'checked' : ''} 
        onchange="updateCategoryVisibility(${cat.id}, this.checked)">
            <span class="visibility-slider"></span>
        </label>
            </label>
        </div>
            </div>
            <div class="editor-item-actions">
        <button class="action-btn" onclick="openEditorModal('category', ${cat.id})">
            <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn btn-danger" onclick="deleteCategory(${cat.id})">
            <i class="fas fa-trash"></i>
        </button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Renderizar selector de categorías para productos
function renderProductsEditorCategorySelect() {
    const select = document.getElementById('editor-category-select');
    select.innerHTML = '<option value="">Todas las categorías</option>';
    
    editorCategories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        option.selected = editorSelectedCategoryId === cat.id;
        select.appendChild(option);
    });
    
    select.onchange = function() {
        editorSelectedCategoryId = this.value ? parseInt(this.value) : null;
        renderProductsEditor();
    };
}

// Renderizar productos
function renderProductsEditor() {
    const container = document.getElementById('products-editor-list');
    container.innerHTML = '';
    
    let filteredProducts = editorProducts;
    if (editorSelectedCategoryId) {
        filteredProducts = editorProducts.filter(p => p.categoryId === editorSelectedCategoryId);
    }
    
    filteredProducts.forEach(prod => {
        const category = editorCategories.find(c => c.id === prod.categoryId) || {name: 'Sin categoría'};

        const item = document.createElement('div');
        item.className = 'editor-item';
        item.innerHTML = `
            <img src="${prod.image}" alt="${prod.name}">
            <div class="editor-item-info">
        <h4>${prod.name}</h4>
        <div>${category.name} | ${prod.unit}</div>
        <div>
            <label class="visibility-label">
        Visible al público:
        <label class="visibility-toggle">
            <input type="checkbox" ${prod.visible ? 'checked' : ''} 
        onchange="updateProductVisibility(${prod.id}, this.checked)">
            <span class="visibility-slider"></span>
        </label>
            </label>
        </div>
            </div>
            <div class="editor-item-actions">
        <button class="action-btn" onclick="openEditorModal('product', ${prod.id})">
            <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn btn-danger" onclick="deleteProduct(${prod.id})">
            <i class="fas fa-trash"></i>
        </button>
            </div>
        `;
        container.appendChild(item);
    });
}

// Abrir modal de edición
function openEditorModal(type, id = null) {
    currentEditItem = { type, id };
    currentUploadType = type; // Para usar en la subida de imágenes
    const modal = document.getElementById('editor-modal');
    const modalBody = document.getElementById('editor-modal-body');
    
    if (type === 'category') {
        const category = id ? editorCategories.find(c => c.id === id) : null;
        modalBody.innerHTML = `
            <h3>${id ? 'Editar' : 'Nueva'} Categoría</h3>
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" id="edit-cat-name" class="form-input" 
                    value="${category ? category.name : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">URL de la Imagen</label>
                <div class="image-input-container">
                    <input type="text" id="edit-cat-image" class="form-input" 
                        value="${category ? category.image : ''}" required>
                    <button class="btn btn-upload" onclick="openImageUploadModal()">
                        <i class="fas fa-cloud-upload-alt"></i> Subir
                    </button>
                </div>
            </div>
            <div class="form-group">
                <label class="visibility-label">
                    Visible al público:
                    <label class="visibility-toggle">
                        <input type="checkbox" id="edit-cat-visible" 
                            ${category ? (category.visible ? 'checked' : '') : 'checked'}>
                        <span class="visibility-slider"></span>
                    </label>
                </label>
            </div>
            <div class="form-group">
                <button class="btn" onclick="saveCategory()">
                    <i class="fas fa-save"></i> Guardar
                </button>
            </div>
        `;
    } 
    else if (type === 'product') {
        const product = id ? editorProducts.find(p => p.id === id) : null;
        const unitOptions = ['unidad', 'kilo', 'atado*', 'mano', 'atado', 'docena', 'cajón', 'plancha'];

        modalBody.innerHTML = `
            <h3>${id ? 'Editar' : 'Nuevo'} Producto</h3>
            <div class="form-group">
                <label class="form-label">Nombre</label>
                <input type="text" id="edit-prod-name" class="form-input" 
                    value="${product ? product.name : ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Categoría</label>
                <select id="edit-prod-category" class="form-input" required>
                    ${editorCategories.map(cat => `
                        <option value="${cat.id}" ${product && product.categoryId === cat.id ? 'selected' : ''}>
                        ${cat.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Unidad</label>
                <select id="edit-prod-unit" class="form-input" required>
                    ${unitOptions.map(unit => `
                        <option value="${unit}" ${product && product.unit === unit ? 'selected' : ''}>
                        ${unit}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">URL de la Imagen</label>
                <input type="text" id="edit-prod-image" class="form-input" 
                    value="${product ? product.image : ''}" required>
                <button class="btn btn-upload" onclick="openImageUploadModal()">
                    <i class="fas fa-cloud-upload-alt"></i> Subir
                </button>
            </div>
            <div class="form-group">
                <label class="visibility-label">
                    Visible al público:
                    <label class="visibility-toggle">
                        <input type="checkbox" id="edit-prod-visible" 
                            ${product ? (product.visible ? 'checked' : '') : 'checked'}>
                        <span class="visibility-slider"></span>
                    </label>
                </label>
            </div>
            <div class="form-group">
                <button class="btn" onclick="saveProduct()">
                    <i class="fas fa-save"></i> Guardar
                </button>
            </div>
        `;
    }
    
    modal.style.display = 'flex';
}

function closeEditorModal() {
    document.getElementById('editor-modal').style.display = 'none';
}

// Guardar categoría
async function saveCategory() {
    const name = document.getElementById('edit-cat-name').value.trim();
    const image = document.getElementById('edit-cat-image').value.trim();
    const visible = document.getElementById('edit-cat-visible').checked;

    currentUploadType = 'category';
    
    if (!name || !image) {
        showToast('Nombre e imagen son requeridos', 'error');
        return;
    }
    
    try {
        if (currentEditItem.id) {
            // Editar existente
            const index = editorCategories.findIndex(c => c.id === currentEditItem.id);
            if (index !== -1) {
                editorCategories[index] = {
                    ...editorCategories[index],
                    name,
                    image,
                    visible
                };
            }
        } else {
            // Nuevo
            editorCategories.push({
                id: Date.now(),
                name,
                image,
                visible,
                createdAt: new Date().toISOString()
            });
        }

        await saveCategoriesToCloud(editorCategories);
        renderCategoriesEditor();
        renderProductsEditorCategorySelect();
        closeEditorModal();
        showToast('Categoría guardada', 'success');
    } catch (error) {
        showToast('Error al guardar: ' + error.message, 'error');
    }
}

// Guardar producto
async function saveProduct() {
    const name = document.getElementById('edit-prod-name').value.trim();
    const categoryId = parseInt(document.getElementById('edit-prod-category').value);
    const unit = document.getElementById('edit-prod-unit').value;
    const image = document.getElementById('edit-prod-image').value.trim();
    const visible = document.getElementById('edit-prod-visible').checked;

    currentUploadType = 'product';
    
    if (!name || !categoryId || !unit || !image) {
        showToast('Todos los campos son requeridos', 'error');
        return;
    }
    
    try {
    if (currentEditItem.id) {
        // Editar existente
        const index = editorProducts.findIndex(p => p.id === currentEditItem.id);
        if (index !== -1) {
            editorProducts[index] = {
                ...editorProducts[index],
                name,
                categoryId,
                unit,
                image,
                visible
            };
        }
    } else {
        // Nuevo
        editorProducts.push({
            id: Date.now(),
            name,
            categoryId,
            unit,
            image,
            visible,
            createdAt: new Date().toISOString()
        });
    }

    await saveProductsToCloud(editorProducts);
    renderProductsEditor();
    closeEditorModal();
    showToast('Producto guardado', 'success');
    } catch (error) {
        showToast('Error al guardar: ' + error.message, 'error');
    }
}

// Actualizar visibilidad
// admin.js - Modificar updateCategoryVisibility
async function updateCategoryVisibility(id, visible) {
    try {
        const index = editorCategories.findIndex(c => c.id === id);
        if (index !== -1) {
            editorCategories[index].visible = visible;
            
            // Actualizar visibilidad de productos relacionados
            editorProducts = editorProducts.map(product => {
        if (product.categoryId === id) {
            return {...product, visible};
        }
        return product;
            });
            
            // Guardar cambios en ambas colecciones
            await Promise.all([
                saveCategoriesToCloud(editorCategories),
                saveProductsToCloud(editorProducts)
            ]);
            
            // Actualizar vistas
            renderCategoriesEditor();
            renderProductsEditorCategorySelect();
            renderProductsEditor();
            
            showToast(`Visibilidad actualizada`, 'success');
        }
    } catch (error) {
        showToast('Error al actualizar: ' + error.message, 'error');
    }
}
async function updateProductVisibility(id, visible) {
    try {
        const index = editorProducts.findIndex(p => p.id === id);
        if (index !== -1) {
            editorProducts[index].visible = visible;
            await saveProductsToCloud(editorProducts);
            showToast(`Visibilidad actualizada`, 'success');
        }
    } catch (error) {
        showToast('Error al actualizar: ' + error.message, 'error');
    }
}

/*async function deleteCloudinaryImage(imageUrl) {
    try {
        // Extraer public_id de la URL
        const urlParts = imageUrl.split('/');
        const publicId = urlParts
            .slice(urlParts.indexOf('yufoods_img') + 1) // Saltar hasta "upload"
            .join('/')                            // Unir partes
            .split('.')[0];                       // Quitar extensión
        console.log('Eliminando imagen con public_id:', publicId);
        // Hacer solicitud de eliminación
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    public_id: `yufoods_img/${publicId}`,
                    timestamp: Math.floor(Date.now() / 1000)
                })
            }
        );
        
        return response.ok;
    } catch (error) {
        console.error('Error eliminando imagen:', error);
        return false;
    }
}*/

// Eliminar elementos
async function deleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría y todos sus productos?')) return;
    
    try {
        // 1. Encontrar la categoría antes de eliminarla
        //const category = editorCategories.find(c => c.id === id);
        
        // 2. Eliminar categoría y productos
        editorCategories = editorCategories.filter(c => c.id !== id);
        editorProducts = editorProducts.filter(p => p.categoryId !== id);

        // 3. Verificar SI LA CATEGORÍA EXISTE y tiene imagen
       /* if (category && category.image && category.image.includes('res.cloudinary.com')) {
            await deleteCloudinaryImage(category.image);
        }*/

        await Promise.all([
            saveCategoriesToCloud(editorCategories),
            saveProductsToCloud(editorProducts)
        ]);

        renderCategoriesEditor();
        renderProductsEditorCategorySelect();
        renderProductsEditor();
        showToast('Categoría eliminada', 'success');
    } catch (error) {
        showToast('Error al eliminar: ' + error.message, 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Eliminar este producto permanentemente?')) return;
    
    try {
        // 1. Encontrar el producto antes de eliminarlo
        //const product = editorProducts.find(p => p.id === id);
        
        // 2. Eliminar producto
        editorProducts = editorProducts.filter(p => p.id !== id);

        // 3. Verificar SI EL PRODUCTO EXISTE y tiene imagen
        /*if (product && product.image && product.image.includes('res.cloudinary.com')) {
            await deleteCloudinaryImage(product.image);
        }*/

        await saveProductsToCloud(editorProducts);
        renderProductsEditor();
        showToast('Producto eliminado', 'success');
    } catch (error) {
        showToast('Error al eliminar: ' + error.message, 'error');
    }
}

// Funciones para manejo de imágenes
function openImageUploadModal() {
    document.getElementById('image-upload-modal').style.display = 'flex';
    document.getElementById('image-file-input').value = '';
    document.getElementById('image-filename').value = document.getElementById('edit-prod-name').value.trim();
    document.getElementById('image-upload-status').innerHTML = '';
}

function closeImageUploadModal() {
    document.getElementById('image-upload-modal').style.display = 'none';
}

async function uploadImageToCloudinary() {
    const fileInput = document.getElementById('image-file-input');
    const filenameInput = document.getElementById('image-filename').value.trim();
    const statusDiv = document.getElementById('image-upload-status');
    
    // Validaciones
    if (!fileInput.files.length) {
        statusDiv.innerHTML = '<p class="error">Selecciona un archivo</p>';
        return;
    }
    if (!filenameInput) {
        statusDiv.innerHTML = '<p class="error">Escribe un nombre para la imagen</p>';
        return;
    }

    const file = fileInput.files[0];
    const validExtensions = ['jpg', 'jpeg', 'png', 'avif', 'webp'];
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (!validExtensions.includes(extension)) {
        statusDiv.innerHTML = '<p class="error">Formato no válido. Usa JPG, PNG, AVIF o WEBP</p>';
        return;
    }

    statusDiv.innerHTML = '<p>Subiendo imagen...</p>';
    
    // Determinar ruta exacta
    let folderPath = 'yufoods_img/';
    
    // Configurar FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folderPath); // Especificar carpeta
    formData.append('public_id', filenameInput); // Solo nombre del archivo

    try {
        // Subir a Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || 'Error en la subida');
        }

        const data = await response.json();
        const imageUrl = `${data.secure_url}`;

        // Actualizar campo de imagen
        const imageField = currentEditItem.type === 'category' 
            ? document.getElementById('edit-cat-image')
            : document.getElementById('edit-prod-image');
            
        imageField.value = imageUrl;

        statusDiv.innerHTML = `
            <p class="success">¡Imagen subida correctamente!</p>
            <p>URL: <a href="${imageUrl}" target="_blank">${imageUrl}</a></p>
            <button class="btn" onclick="copyToClipboard('${imageUrl}')">
                <i class="fas fa-copy"></i> Copiar URL
            </button>
        `;
    } catch (error) {
        console.error('Error Cloudinary:', error);
        statusDiv.innerHTML = `
            <p class="error">Error en la subida</p>
        `;
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    showToast('URL copiada al portapapeles');
}

// Cerrar modales al hacer clic fuera
function setupModalClosers(){
    // Modal de detalles de pedido
    document.getElementById('order-details-modal').addEventListener('click', (e) => {
if (e.target === document.getElementById('order-details-modal')) {
    closeOrderDetails();
}
    });
    
    // Modal de editor
    document.getElementById('editor-modal').addEventListener('click', (e) => {
if (e.target === document.getElementById('editor-modal')) {
    closeEditorModal();
}
    });
    
    // Modal de subida de imágenes
    document.getElementById('image-upload-modal').addEventListener('click', (e) => {
if (e.target === document.getElementById('image-upload-modal')) {
    closeImageUploadModal();
}
    });
}

// Función para guardar la sección activa
function saveActiveSection(section) {
    sessionStorage.setItem('activeSection', section);
}

// Función para cargar la sección activa
function loadActiveSection() {
    return sessionStorage.getItem('activeSection') || 'admin-panel';
}

// Función para mostrar la sección correcta
function showActiveSection() {
    const activeSection = loadActiveSection();
    
    // Ocultar todas las secciones
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('store-editor-page').style.display = 'none';
    
    // Mostrar sección activa
    if (activeSection === 'store-editor') {
        document.getElementById('store-editor-page').style.display = 'block';
        loadStoreEditor();
    } else if (activeSection === 'admin-panel') {
        document.getElementById('admin-panel').style.display = 'block';
        loadOrders();
    } else {
        document.getElementById('login-section').style.display = 'block';
    }
}
