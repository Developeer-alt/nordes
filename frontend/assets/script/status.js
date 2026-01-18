    // Configurações
    const BACKEND_URL = 'http://localhost:5000';
    const FRONTEND_URL = window.location.origin;
    const CHECK_INTERVAL = 30000; // 30 segundos

    let checkInterval;
    let nextCheckCountdown;

    // Função para formatar tempo
    function formatTime(ms) {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }

    // Função para obter timestamp formatado
    function getTimestamp() {
        return new Date().toLocaleTimeString('pt-BR');
    }

    // Função para atualizar status visual
    function updateStatusUI(service, isConnected, responseTime = null) {
        const dot = document.getElementById(`${service}-dot`);
        const status = document.getElementById(`${service}-status`);
        const pulse = document.getElementById(`${service}-pulse`);
        const lastCheck = document.getElementById(`${service}-last-check`);
        const response = document.getElementById(`${service}-response`);

        if (isConnected) {
            dot.className = 'status-dot connected';
            status.className = 'status-text connected';
            status.textContent = 'Conectado';
            if (pulse) pulse.style.borderColor = '#00ff88';
        } else {
            dot.className = 'status-dot disconnected';
            status.className = 'status-text disconnected';
            status.textContent = 'Desconectado';
            if (pulse) pulse.style.borderColor = '#ff4444';
        }

        lastCheck.textContent = getTimestamp();
        if (response && responseTime !== null) {
            response.textContent = formatTime(responseTime);
        }
    }

    // Verificar Frontend
    async function checkFrontend() {
        const startTime = performance.now();
        try {
            // Testa a página home.html do frontend
            const testUrl = `${FRONTEND_URL}/paginas/home.html`;
            const response = await fetch(testUrl, { 
                method: 'GET', 
                cache: 'no-cache',
                mode: 'no-cors' // Permite requisição sem CORS
            });
            const responseTime = performance.now() - startTime;
            
            // Com no-cors, response.ok sempre é false, mas se não der erro, está funcionando
            const isConnected = true; // Se chegou aqui sem erro, está conectado
            
            document.getElementById('frontend-url').textContent = FRONTEND_URL;
            updateStatusUI('frontend', isConnected, responseTime);
            return isConnected;
        } catch (error) {
            console.error('Erro ao verificar frontend:', error);
            document.getElementById('frontend-url').textContent = FRONTEND_URL;
            document.getElementById('frontend-response').textContent = 'Erro';
            updateStatusUI('frontend', false);
            return false;
        }
    }

    // Verificar Backend
    async function checkBackend() {
        const startTime = performance.now();
        try {
            const response = await fetch(`${BACKEND_URL}/api/books`, {
                method: 'GET',
                cache: 'no-cache'
            });
            const responseTime = performance.now() - startTime;
            
            document.getElementById('backend-url').textContent = BACKEND_URL;
            updateStatusUI('backend', response.ok, responseTime);
            return response.ok;
        } catch (error) {
            console.error('Erro ao verificar backend:', error);
            document.getElementById('backend-url').textContent = BACKEND_URL;
            document.getElementById('backend-response').textContent = 'Erro';
            updateStatusUI('backend', false);
            return false;
        }
    }

    // Verificar Banco de Dados (através do backend)
    async function checkDatabase() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/books`, {
                method: 'GET',
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const data = await response.json();
                const recordCount = data.length || 0;
                document.getElementById('database-records').textContent = recordCount;
                updateStatusUI('database', true);
                return true;
            } else {
                document.getElementById('database-records').textContent = 'Erro';
                updateStatusUI('database', false);
                return false;
            }
        } catch (error) {
            console.error('Erro ao verificar banco de dados:', error);
            document.getElementById('database-records').textContent = 'Erro';
            updateStatusUI('database', false);
            return false;
        }
    }

    // Verificar todos os serviços
    async function checkAllStatus() {
        console.log('Verificando status de todos os serviços...');
        
        // Resetar contadores
        clearInterval(nextCheckCountdown);
        let secondsLeft = CHECK_INTERVAL / 1000;
        
        // Executar verificações
        await Promise.all([
            checkFrontend(),
            checkBackend(),
            checkDatabase()
        ]);

        // Atualizar timestamp global
        document.getElementById('global-last-check').textContent = getTimestamp();

        // Iniciar contagem regressiva
        nextCheckCountdown = setInterval(() => {
            secondsLeft--;
            document.getElementById('next-check').textContent = `${secondsLeft}s`;
            if (secondsLeft <= 0) {
                clearInterval(nextCheckCountdown);
            }
        }, 1000);
    }

    // Obter informações do sistema
    function getSystemInfo() {
        // Navegador
        const ua = navigator.userAgent;
        let browserName = 'Desconhecido';
        if (ua.indexOf('Firefox') > -1) browserName = 'Firefox';
        else if (ua.indexOf('Chrome') > -1) browserName = 'Chrome';
        else if (ua.indexOf('Safari') > -1) browserName = 'Safari';
        else if (ua.indexOf('Edge') > -1) browserName = 'Edge';
        document.getElementById('browser-info').textContent = browserName;

        // Sistema Operacional
        let osName = 'Desconhecido';
        if (ua.indexOf('Win') > -1) osName = 'Windows';
        else if (ua.indexOf('Mac') > -1) osName = 'MacOS';
        else if (ua.indexOf('Linux') > -1) osName = 'Linux';
        else if (ua.indexOf('Android') > -1) osName = 'Android';
        else if (ua.indexOf('iOS') > -1) osName = 'iOS';
        document.getElementById('os-info').textContent = osName;

        // Resolução
        const resolution = `${window.screen.width}x${window.screen.height}`;
        document.getElementById('resolution-info').textContent = resolution;

        // Conexão
        const connection = navigator.onLine ? 'Online' : 'Offline';
        document.getElementById('connection-info').textContent = connection;
    }

    // Dropdown de categorias
    const btnCategories = document.getElementById('btn-categories');
    const dropdown = document.getElementById('categories-dropdown');

    if (btnCategories && dropdown) {
        btnCategories.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!btnCategories.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
    }

    // Atualizar carrinho
    function updateCartUI() {
        const cart = JSON.parse(localStorage.getItem('nordes_cart')) || [];
        const counter = document.getElementById('cart-counter');
        const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
        if (counter) counter.innerText = `Carrinho (${totalItems})`;
    }

    // Inicialização
    document.addEventListener('DOMContentLoaded', () => {
        console.log('Página de status carregada');
        
        // Obter informações do sistema
        getSystemInfo();
        
        // Atualizar carrinho
        updateCartUI();
        
        // Primeira verificação
        checkAllStatus();
        
        // Configurar verificação automática
        checkInterval = setInterval(checkAllStatus, CHECK_INTERVAL);
    });

    // Limpar intervalos ao sair da página
    window.addEventListener('beforeunload', () => {
        clearInterval(checkInterval);
        clearInterval(nextCheckCountdown);
    });