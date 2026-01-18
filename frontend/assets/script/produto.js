    // ===== ESTADO GLOBAL =====
    let cart = JSON.parse(localStorage.getItem('nordes_cart')) || [];
    let currentProduct = null;

    // ===== CAPTURAR DADOS DA URL =====
    function loadProduct() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const title = params.get('title') || "Produto";
        const price = parseFloat(params.get('price')) || 0;
        const author = params.get('author') || "Autor Desconhecido";
        const image = params.get('image') || "livro1.jpg";
        const desc = params.get('desc') || "Sem descrição disponível.";
        const date = params.get('date') || "N/A";
        const stock = params.get('stock') || "Consulte";

        if (!id) {
            window.location.href = 'home.html';
            return;
        }

        currentProduct = { id, title, price, imgPath: image, author };

        // Atualizar UI
        document.getElementById('prod-title').innerText = title;
        document.getElementById('prod-author').innerText = author;
        document.getElementById('prod-price').innerText = `R$ ${price.toFixed(2).replace('.', ',')}`;
        document.getElementById('prod-img').src = image;
        document.getElementById('prod-desc').innerText = desc;
        document.getElementById('prod-date').innerText = date;
        document.getElementById('prod-stock').innerText = stock;
        
        document.title = `${title} - Nordes Studio`;
        
        updateCartUI();
    }

    function updateCartUI() {
        const counter = document.getElementById('cart-counter');
        const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
        counter.innerText = `Carrinho (${totalItems})`;
        localStorage.setItem('nordes_cart', JSON.stringify(cart));
    }

    function showNotification(text) {
        const notif = document.getElementById('notification');
        notif.innerText = text;
        notif.classList.add('active');
        setTimeout(() => notif.classList.remove('active'), 3000);
    }

    window.addToCart = function() {
        if (!currentProduct) return;

        const existingItem = cart.find(item => item.id === currentProduct.id);
        if (existingItem) {
            existingItem.qty = (existingItem.qty || 1) + 1;
            showNotification(`Quantidade de "${currentProduct.title}" aumentada!`);
        } else {
            cart.push({ ...currentProduct, qty: 1 });
            showNotification(`"${currentProduct.title}" adicionado ao carrinho!`);
        }
        updateCartUI();
    };

    window.buyNow = function() {
        addToCart();
        window.location.href = 'carrinho.html';
    };

    loadProduct();