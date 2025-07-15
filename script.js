const categorias = {
    "Cebolla, tomate, ajo, ajíes, limón, palta": ["Cebolla", "Tomate", "Ajo", "Ajíes", "Limón", "Palta"],
    "Papa, camote, otros tubérculos": ["Papa", "Camote", "Otros tubérculos"],
    "Espinacas, lechugas y hierbas": ["Espinacas", "Lechugas", "Hierbas"],
    "Arverjitas, vainitas, habas y otras legumbres": ["Arverjitas", "Vainitas", "Habas", "Otras legumbres"],
    "Choclo, zanahoria, pepinos y beterragas": ["Choclo", "Zanahoria", "Pepinos", "Beterragas"],
    "Apio y pimientos": ["Apio", "Pimientos"],
    "Brócoli, col, coliflor y alcachofas": ["Brócoli", "Col", "Coliflor", "Alcachofas"],
    "Berenjenas y caiguas": ["Berenjenas", "Caiguas"],
    "Verduras orientales": ["Verduras orientales"],
    "Frutas": ["Frutas variadas"],
    "Aceitunas y Huevos pardos": ["Aceitunas", "Huevos pardos"]
};

const categoriasDiv = document.getElementById("categorias");

for (const categoria in categorias) {
    const catDiv = document.createElement("div");
    catDiv.className = "categoria";
    const header = document.createElement("h2");
    header.textContent = categoria;
    header.style.cursor = "pointer";
    const productosDiv = document.createElement("div");
    productosDiv.style.display = "none";

    categorias[categoria].forEach(producto => {
        const prodDiv = document.createElement("div");
        prodDiv.className = "producto";
        prodDiv.innerHTML = `
            <span>${producto}</span>
            <select id="cantidad-${producto}">
                ${[...Array(10).keys()].map(i => `<option value="${i+1}">${i+1}</option>`).join("")}
            </select>
            <button onclick="agregarAlCarrito('${producto}')">Agregar al carrito</button>
        `;
        productosDiv.appendChild(prodDiv);
    });

    header.onclick = () => {
        productosDiv.style.display = productosDiv.style.display === "none" ? "block" : "none";
    };

    catDiv.appendChild(header);
    catDiv.appendChild(productosDiv);
    categoriasDiv.appendChild(catDiv);
}

function agregarAlCarrito(producto) {
    const cantidad = document.getElementById("cantidad-" + producto).value;
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.push({ producto, cantidad });
    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert("Producto agregado al carrito");
}

