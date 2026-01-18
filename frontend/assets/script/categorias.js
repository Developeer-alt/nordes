    let allProducts = [];
    let allCategories = [];
    let currentCategory = null;

    // ===== LOAD CATEGORIES AND PRODUCTS =====
    async function loadCategoryProducts() {
        const urlParams = new URLSearchParams(window.location.search);
        currentCategory = urlParams.get('cat');

        try {
            const response = await fetch('assets/books-json/books_data.json');
            const data = await response.json();
            allProducts = data;

            // Extrair categorias únicas
            const categoriesSet = new Set();
            data.forEach(product => {
                if (product.categoria) {
                    categoriesSet.add(product.categoria);
                }
            });
            allCategories = Array.from(categoriesSet).sort();

            // Se não houver categoria na URL, usar a primeira disponível
            if (!currentCategory && allCategories.length > 0) {
                currentCategory = allCategories[0];
                // Atualizar URL sem recarregar
                window.history.replaceState({}, '', `categorias.html?cat=${currentCategory}`);
            }

            // Renderizar botões de categorias
            renderCategoryButtons();

            // Renderizar produtos
            renderProducts();
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            document.getElementById('products-container').innerHTML = '<div class="no-products">Erro ao carregar produtos.</div>';
        }
    }

    // ===== RENDER CATEGORY BUTTONS =====
    function renderCategoryButtons() {
        const container = document.getElementById('categories-filter-container');
        container.innerHTML = '';

        allCategories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = 'category-filter-btn';
            btn.textContent = category;

            if (category === currentCategory) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                currentCategory = category;
                window.history.pushState({}, '', `categorias.html?cat=${category}`);
                renderCategoryButtons();
                renderProducts();
                // Scroll para o topo da página
                document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
            });

            container.appendChild(btn);
        });
    }

    // ===== RENDER PRODUCTS =====
    function renderProducts() {
        const container = document.getElementById('products-container');
        const titleEl = document.getElementById('category-display');
        const countEl = document.getElementById('category-count');

        // Atualizar título
        titleEl.innerText = currentCategory || 'Todas as Categorias';

        // Filtrar produtos
        let filteredProducts = allProducts;
        if (currentCategory) {
            filteredProducts = allProducts.filter(p => 
                p.categoria && p.categoria.toLowerCase() === currentCategory.toLowerCase()
            );
        }

        // Atualizar contagem
        countEl.innerText = `${filteredProducts.length} produto${filteredProducts.length !== 1 ? 's' : ''} encontrado${filteredProducts.length !== 1 ? 's' : ''}`;

        // Renderizar produtos
        if (filteredProducts.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <p>Nenhum produto encontrado nesta categoria.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredProducts.map(product => `
            <a href="produto.html?id=${product.id}" class="book-card">
                <div class="book-cover-wrapper">
                    <img src="${product.imagem || 'assets/img/placeholder.png'}" alt="${product.titulo}" class="book-cover" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 200 300%22%3E%3Crect fill=%22%23333%22 width=%22200%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2216%22%3EImagem não disponível%3C/text%3E%3C/svg%3E'">
                </div>
                <div class="book-info">
                    <h3>${product.titulo}</h3>
                    <div class="book-price">R$ ${product.preco.toFixed(2).replace('.', ',')}</div>
                </div>
            </a>
        `).join('');
    }

    // ===== INITIALIZE =====
    window.addEventListener('load', loadCategoryProducts);

    // ===== HANDLE BACK/FORWARD BUTTONS =====
    window.addEventListener('popstate', () => {
        const urlParams = new URLSearchParams(window.location.search);
        currentCategory = urlParams.get('cat');
        renderCategoryButtons();
        renderProducts();
    });