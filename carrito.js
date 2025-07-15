function mostrarCarrito() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const listado = document.getElementById("carrito-listado");
    listado.innerHTML = "<ul>" + carrito.map(item => `<li>${item.producto} - Cantidad: ${item.cantidad}</li>`).join("") + "</ul>";
}

function vaciarCarrito() {
    localStorage.removeItem("carrito");
    mostrarCarrito();
}

function comprar() {
    const nombre = document.getElementById("nombre").value;
    const direccion = document.getElementById("direccion").value;
    if (!nombre || !direccion) {
        alert("Por favor complete todos los campos.");
        return;
    }
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const mensaje = `Nombre: ${nombre}\nDirección: ${direccion}\n\nProductos:\n` + carrito.map(item => `${item.producto} - Cantidad: ${item.cantidad}`).join("\n");
    window.location.href = "mailto:tuemail@dominio.com?subject=Compra de Verduras y Frutas&body=" + encodeURIComponent(mensaje);
}

mostrarCarrito();
