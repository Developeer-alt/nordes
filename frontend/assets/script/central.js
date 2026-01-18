
const API_URL = 'http://localhost:5000/api';

    document.getElementById('password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const oldPassword = document.getElementById('old-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const messageDiv = document.getElementById('form-message');

        if (newPassword !== confirmPassword) {
            messageDiv.textContent = 'As novas senhas não coincidem.';
            messageDiv.className = 'message error';
            return;
        }

        if (newPassword.length !== 6 || !/^\d+$/.test(newPassword)) {
            messageDiv.textContent = 'A senha deve conter exatamente 6 números.';
            messageDiv.className = 'message error';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = 'Senha alterada com sucesso!';
                messageDiv.className = 'message success';
                document.getElementById('password-form').reset();
            } else {
                messageDiv.textContent = data.message || 'Erro ao alterar senha.';
                messageDiv.className = 'message error';
            }
        } catch (error) {
            messageDiv.textContent = 'Erro de conexão com o servidor.';
            messageDiv.className = 'message error';
        }
    });