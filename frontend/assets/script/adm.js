
const API_URL = 'http://localhost:5000/api/books';

        async function loadBooks() {
            try {
                const res = await fetch(API_URL);
                const books = await res.json();
                window.allBooks = books;
                renderBooks(books);
                updateStats(books);
            } catch (error) {
                console.error('Erro ao carregar produtos:', error);
            }
        }

        function renderBooks(books) {
            const UPLOADS_URL = 'http://localhost:5000/uploads/';
            const tbody = document.getElementById('books-table-body');
            tbody.innerHTML = books.map(book => {
                const imgPath = book.image ? (book.image.startsWith('http') ? book.image : UPLOADS_URL + book.image) : '../public/assets/img/logo/logo.png';
                return `
                <tr>
                    <td>
                        <div class="product-cell">
                            <div class="product-img-wrapper">
                                <img src="${imgPath}" class="product-img" onerror="this.src='../public/assets/img/logo/logo.png'">
                            </div>
                            <div>
                                <div style="font-weight: 700; color: #fff; line-height: 1.2; margin-bottom: 4px;">${book.title}</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted);">${book.author}</div>
                            </div>
                        </div>
                    </td>
                    <td><span style="color: var(--text-muted); font-size: 0.9rem;">${book.category}</span></td>
                    <td><span style="font-weight: 600;">R$ ${parseFloat(book.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span></td>
                    <td>
                        <span class="badge ${book.stock > 5 ? 'badge-stock' : 'badge-low'}">
                            ${book.stock} unidades
                        </span>
                    </td>
                    <td class="actions-cell" style="justify-content: flex-end;">
                        <button class="btn btn-outline" style="padding: 0.5rem; border-radius: 8px;" onclick="editBook(${book.id})" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                        </button>
                        <button class="btn btn-danger" style="padding: 0.5rem; border-radius: 8px;" onclick="deleteBook(${book.id})" title="Excluir">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </td>
                </tr>
                `;
            }).join('');
        }

        function updateStats(books) {
            const totalProducts = books.length;
            const totalStock = books.reduce((sum, b) => sum + b.stock, 0);
            const totalValue = books.reduce((sum, b) => sum + (b.price * b.stock), 0);

            document.getElementById('stat-total-products').innerText = totalProducts;
            document.getElementById('stat-total-stock').innerText = totalStock;
            document.getElementById('stat-total-value').innerText = `R$ ${totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        }

        function openAddModal() {
            resetForm();
            document.getElementById('product-form-container').style.display = 'block';
            document.getElementById('form-title').innerText = 'Adicionar Novo Produto';
            document.getElementById('submit-btn').innerText = 'Cadastrar Produto';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        function closeForm() {
            document.getElementById('product-form-container').style.display = 'none';
            resetForm();
        }

        document.getElementById('book-form').onsubmit = async (e) => {
            e.preventDefault();
            const id = document.getElementById('book-id').value;
            const formData = new FormData();
            formData.append('title', document.getElementById('title').value);
            formData.append('author', document.getElementById('author').value);
            formData.append('price', document.getElementById('price').value);
            formData.append('stock', document.getElementById('stock').value);
            formData.append('category', document.getElementById('category').value);
            formData.append('description', document.getElementById('description').value);
            
            const imageFile = document.getElementById('image').files[0];
            if (imageFile) formData.append('image', imageFile);

            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_URL}/${id}` : API_URL;

            try {
                const res = await fetch(url, { method, body: formData });
                if (res.ok) {
                    closeForm();
                    loadBooks();
                    alert('Produto salvo com sucesso!');
                }
            } catch (error) {
                alert('Erro ao salvar produto.');
            }
        };

        async function editBook(id) {
            try {
                const res = await fetch(`${API_URL}/${id}`);
                const book = await res.json();
                
                document.getElementById('book-id').value = book.id;
                document.getElementById('title').value = book.title;
                document.getElementById('author').value = book.author;
                document.getElementById('price').value = book.price;
                document.getElementById('stock').value = book.stock;
                document.getElementById('category').value = book.category;
                document.getElementById('description').value = book.description;
                
                document.getElementById('product-form-container').style.display = 'block';
                document.getElementById('form-title').innerText = 'Editar Produto';
                document.getElementById('submit-btn').innerText = 'Atualizar Produto';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } catch (error) {
                alert('Erro ao carregar dados do produto.');
            }
        }

        async function deleteBook(id) {
            if (confirm('Tem certeza que deseja excluir este produto?')) {
                try {
                    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                    loadBooks();
                } catch (error) {
                    alert('Erro ao excluir produto.');
                }
            }
        }

        function resetForm() {
            document.getElementById('book-form').reset();
            document.getElementById('book-id').value = '';
            document.getElementById('submit-btn').innerText = 'Salvar Produto';
        }

        function showSection(section) {
            console.log('Navegando para:', section);
        }

        document.getElementById('search-products').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = window.allBooks.filter(book => 
                book.title.toLowerCase().includes(term) || 
                book.author.toLowerCase().includes(term) ||
                book.category.toLowerCase().includes(term)
            );
            renderBooks(filtered);
        });

        loadBooks();