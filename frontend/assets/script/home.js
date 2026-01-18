    // ===== ESTADO GLOBAL (CARRINHO) =====
    let cart = JSON.parse(localStorage.getItem('nordes_cart')) || [];

    function updateCartUI() {
        const counter = document.getElementById('cart-counter');
        // Calcula o total de itens (soma das quantidades)
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

    // ===== BANNERS =====
    const bannerWrapper = document.getElementById('banner-wrapper');
    const bannerConfigs = [
        { title: "Nordes Studio — A ideia nasce aqui", btn: "Saiba Mais" },
        { title: "Semana do Mangá: 40% OFF", btn: "Ver Promoções" },
        { title: "Novidades em Fantasia", btn: "Confira" }
    ];

    const formats = ['.jpg', '.png', '.jpeg', '.webp',];

    bannerConfigs.forEach((config, i) => {
        const bannerNum = i + 1;
        const slide = document.createElement('div');
        slide.className = 'swiper-slide';
        const img = document.createElement('img');
        let formatIdx = 0;
        const tryLoad = () => {
            if (formatIdx < formats.length) {
                img.src = `../assets/images/banners/banner${bannerNum}${formats[formatIdx]}`;
                formatIdx++;
            } else {
                img.src = '../assets/images/banners/banner1.jpg';
            }
        };
        img.onerror = tryLoad;
        tryLoad();
        slide.innerHTML = `<div class="slide-overlay"></div><div class="slide-content"><h2>${config.title}</h2><a href="#" class="btn-slide">${config.btn}</a></div>`;
        slide.prepend(img);
        bannerWrapper.appendChild(slide);
    });

    const swiper = new Swiper('.hero-swiper', {
        loop: true,
        effect: 'fade',
        fadeEffect: { crossFade: true },
        autoplay: { delay: 5000, disableOnInteraction: false },
        pagination: { el: '.swiper-pagination', clickable: true }
    });

    // ===== CATEGORIES & DROPDOWN =====
    const btnCategories = document.getElementById('btn-categories');
    const dropdown = document.getElementById('categories-dropdown');

    btnCategories.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!btnCategories.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // ===== COOKIE BANNER =====
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('accept-cookies');
    const declineBtn = document.getElementById('decline-cookies');

    const checkCookies = () => {
        const accepted = localStorage.getItem('cookiesAccepted');
        const declinedUntil = localStorage.getItem('cookiesDeclinedUntil');
        const now = new Date().getTime();
        if (accepted === 'true') return;
        if (declinedUntil && now < parseInt(declinedUntil)) return;
        setTimeout(() => cookieBanner.classList.add('active'), 1000);
    };

    acceptBtn.addEventListener('click', () => {
        cookieBanner.classList.remove('active');
        localStorage.setItem('cookiesAccepted', 'true');
    });

    declineBtn.addEventListener('click', () => {
        cookieBanner.classList.remove('active');
        const expiry = new Date().getTime() + (24 * 60 * 60 * 1000);
        localStorage.setItem('cookiesDeclinedUntil', expiry.toString());
    });

    checkCookies();

    // ===== ATALHO SECRETO =====
    let logoClicks = 0;
    let lastClickTime = 0;
    const secretLogo = document.getElementById('secret-logo');
    const secretModal = document.getElementById('secret-modal');
    const pinInputs = document.querySelectorAll('.pin-input');
    const secretError = document.getElementById('secret-error');

    secretLogo.addEventListener('click', (e) => {
        e.preventDefault();
        const now = new Date().getTime();
        if (now - lastClickTime < 500) {
            logoClicks++;
        } else {
            logoClicks = 1;
        }
        lastClickTime = now;

        if (logoClicks === 5) {
            logoClicks = 0;
            secretModal.style.display = 'flex';
            pinInputs[0].focus();
        }
    });

    pinInputs.forEach((input, index) => {
        input.addEventListener('input', async (e) => {
            if (e.target.value && index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
            
            const pin = Array.from(pinInputs).map(i => i.value).join('');
            if (pin.length === 6) {
                try {
                    const response = await fetch('http://localhost:5000/api/auth/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: pin })
                    });
                    
                    if (response.ok) {
                        window.location.href = '../private-pages/central.html';
                    } else {
                        secretError.style.display = 'block';
                        pinInputs.forEach(i => i.value = '');
                        pinInputs[0].focus();
                        setTimeout(() => secretError.style.display = 'none', 2000);
                    }
                } catch (err) {
                    console.error('Erro na autenticação:', err);
                }
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                pinInputs[index - 1].focus();
            }
        });
    });

    document.getElementById('close-secret').addEventListener('click', () => {
        secretModal.style.display = 'none';
        pinInputs.forEach(i => i.value = '');
    });

    // ===== BUSCA EM TEMPO REAL =====
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('.book-card');
        cards.forEach(card => {
            const title = card.querySelector('h3').innerText.toLowerCase();
            const author = card.querySelector('.book-author').innerText.toLowerCase();
            if (title.includes(term) || author.includes(term)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });

    // ===== GERADOR DE CONTEÚDO & FUNCIONALIDADE DOS CARDS =====
    const sections = [
        { title: "Mais Vendidos", type: "livro" },
        { title: "Mangás em Destaque", type: "manga" },
        { title: "Lançamentos", type: "livro" },
        { title: "Ficção Científica", type: "livro" },
        { title: "Fantasia Épica", type: "livro" },
        { title: "Terror e Suspense", type: "livro" },
        { title: "Promoções Imperdíveis", type: "manga" }
    ];

    const mainContent = document.getElementById('main-content');

    // Carregar dados reais dos livros da API Flask
    const API_URL = 'http://localhost:5000/api/books';
    const UPLOADS_URL = 'http://localhost:5000/uploads/';

    fetch(API_URL)
        .then(response => response.json())
        .then(booksData => {
            if (booksData.length === 0) {
                mainContent.innerHTML = '<p style="text-align:center; padding: 2rem;">Nenhum produto cadastrado no momento.</p>';
                return;
            }

            sections.forEach((sec, secIdx) => {
                const sectionHtml = `
                    <section class="section-container">
                        <div class="section-header"><h2 class="section-title">${sec.title}</h2></div>
                        <div class="books-wrapper">
                            <div class="books-scroll" id="section-${secIdx}"></div>
                        </div>
                    </section>
                `;
                mainContent.insertAdjacentHTML('beforeend', sectionHtml);
                const scrollContainer = document.getElementById(`section-${secIdx}`);
                
                // Filtrar livros por categoria se necessário, ou apenas distribuir
                const filteredBooks = booksData.filter(b => b.category === sec.type || sec.type === 'livro');
                const displayBooks = filteredBooks.length > 0 ? filteredBooks : booksData;

                displayBooks.forEach((book, idx) => {
                    const id = book.id;
                    const imgPath = book.image.startsWith('http') ? book.image : UPLOADS_URL + book.image;
                    const price = book.price.toFixed(2);
                    const title = book.title;
                    const author = book.author;
                    
                    const cardHtml = `
                        <div class="book-card" data-id="${id}" onclick="window.location.href='produto.html?id=${id}&title=${encodeURIComponent(title)}&price=${price}&author=${encodeURIComponent(author)}&image=${imgPath}&desc=${encodeURIComponent(book.description)}&date=${book.release_date}&stock=${book.stock}'" style="cursor: pointer;">
                            <div class="book-cover-wrapper">
                                <img src="${imgPath}" alt="${title}" class="book-cover" loading="lazy">
                            </div>
                            <div class="book-info">
                                <h3>${title}</h3>
                                <p class="book-author">${author}</p>
                            </div>
                            <div class="book-footer">
                                <div class="book-price-row"><p class="book-price">R$ ${price.replace('.', ',')}</p></div>
                            </div>
                        </div>
                    `;
                    scrollContainer.insertAdjacentHTML('beforeend', cardHtml);
                });
            });
        })
        .catch(err => console.error("Erro ao carregar dados dos livros:", err));

    // Funções de Ação Corrigidas (Sem Duplicação)
    window.addToCart = function(id, title, price, imgPath) {
        // Verifica se o item já existe no carrinho
        const existingItem = cart.find(item => item.id === id);
        
        if (existingItem) {
            // Se já existe, apenas aumenta a quantidade
            existingItem.qty = (existingItem.qty || 1) + 1;
            showNotification(`Quantidade de "${title}" aumentada no carrinho!`);
        } else {
            // Se não existe, adiciona como novo item
            const item = { id, title, price, imgPath, qty: 1 };
            cart.push(item);
            showNotification(`"${title}" adicionado ao carrinho!`);
        }
        
        updateCartUI();
        
        // Feedback visual no botão
        const btn = document.querySelector(`.book-card[data-id="${id}"] .btn-add-cart-card`);
        const originalText = btn.innerText;
        btn.innerText = "Adicionado!";
        btn.classList.add('added');
        setTimeout(() => {
            btn.innerText = originalText;
            btn.classList.remove('added');
        }, 2000);
    };

	    window.buyNow = function(id, title, price, imgPath) {
	        addToCart(id, title, price, imgPath);
	        window.location.href = 'carrinho.html';
	    };

    // Inicializar UI
    updateCartUI();