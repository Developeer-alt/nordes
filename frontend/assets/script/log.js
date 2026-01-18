    // ===== TOGGLE AUTH MODE =====
    function toggleAuthMode(e) {
        e.preventDefault();
        document.getElementById('login-section').classList.toggle('active');
        document.getElementById('signup-section').classList.toggle('active');
        clearErrors();
    }

    // ===== TOGGLE PASSWORD VISIBILITY =====
    function togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
    }

    // ===== CLEAR ERRORS =====
    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.remove('show');
            el.innerText = '';
        });
    }

    // ===== SHOW ERROR =====
    function showError(elementId, message) {
        const errorEl = document.getElementById(elementId);
        if (errorEl) {
            errorEl.innerText = message;
            errorEl.classList.add('show');
        }
    }

    // ===== VALIDATE EMAIL =====
    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    // ===== VALIDATE PHONE =====
    function validatePhone(phone) {
        if (!phone) return true;
        const regex = /^(\+55)?(\d{2})?(\d{4,5})(\d{4})$/;
        return regex.test(phone.replace(/\D/g, ''));
    }

    // ===== LOGIN FORM =====
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        let isValid = true;

        if (!validateEmail(email)) {
            showError('login-email-error', 'Email inválido');
            isValid = false;
        }

        if (password.length < 6) {
            showError('login-password-error', 'Senha deve ter pelo menos 6 caracteres');
            isValid = false;
        }

        if (!isValid) return;

        const btn = document.getElementById('login-btn');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>Entrando...';

        try {
            // Simular chamada de API
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Armazenar dados no localStorage
            localStorage.setItem('nordes_user', JSON.stringify({
                email: email,
                rememberMe: document.getElementById('remember-me').checked,
                loginTime: new Date().toISOString()
            }));

            // Redirecionar para home
            window.location.href = 'home.html';
        } catch (error) {
            showError('login-email-error', 'Erro ao fazer login. Tente novamente.');
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });

    // ===== SIGNUP FORM =====
    document.getElementById('signup-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const firstname = document.getElementById('signup-firstname').value.trim();
        const lastname = document.getElementById('signup-lastname').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const phone = document.getElementById('signup-phone').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirm = document.getElementById('signup-confirm').value;
        const terms = document.getElementById('terms').checked;

        let isValid = true;

        if (firstname.length < 2) {
            showError('signup-firstname-error', 'Nome deve ter pelo menos 2 caracteres');
            isValid = false;
        }

        if (lastname.length < 2) {
            showError('signup-lastname-error', 'Sobrenome deve ter pelo menos 2 caracteres');
            isValid = false;
        }

        if (!validateEmail(email)) {
            showError('signup-email-error', 'Email inválido');
            isValid = false;
        }

        if (phone && !validatePhone(phone)) {
            showError('signup-phone-error', 'Telefone inválido');
            isValid = false;
        }

        if (password.length < 6) {
            showError('signup-password-error', 'Senha deve ter pelo menos 6 caracteres');
            isValid = false;
        }

        if (password !== confirm) {
            showError('signup-confirm-error', 'Senhas não conferem');
            isValid = false;
        }

        if (!terms) {
            showError('terms', 'Você deve aceitar os termos de uso');
            isValid = false;
        }

        if (!isValid) return;

        const btn = document.getElementById('signup-btn');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>Criando conta...';

        try {
            // Simular chamada de API
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Armazenar dados no localStorage
            localStorage.setItem('nordes_user', JSON.stringify({
                firstname: firstname,
                lastname: lastname,
                email: email,
                phone: phone,
                createdAt: new Date().toISOString()
            }));

            // Mostrar mensagem de sucesso e redirecionar
            alert('Conta criada com sucesso! Bem-vindo à Nordes Studio!');
            window.location.href = 'home.html';
        } catch (error) {
            showError('signup-email-error', 'Erro ao criar conta. Tente novamente.');
            btn.disabled = false;
            btn.innerText = originalText;
        }
    });

    // ===== SOCIAL LOGIN HANDLERS =====
    document.getElementById('google-login').addEventListener('click', () => {
        alert('Integração com Google OAuth será implementada com backend.');
    });

    document.getElementById('microsoft-login').addEventListener('click', () => {
        alert('Integração com Microsoft OAuth será implementada com backend.');
    });

    document.getElementById('google-signup').addEventListener('click', () => {
        alert('Integração com Google OAuth será implementada com backend.');
    });

    document.getElementById('microsoft-signup').addEventListener('click', () => {
        alert('Integração com Microsoft OAuth será implementada com backend.');
    });

    // ===== CHECK IF USER IS LOGGED IN =====
    window.addEventListener('load', () => {
        const user = localStorage.getItem('nordes_user');
        if (user) {
            // Se o usuário já está logado, redirecionar para home
            window.location.href = '../../../faltam/perfil.html';
        }
    });