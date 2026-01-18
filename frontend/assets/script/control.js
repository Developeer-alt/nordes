
const MANAGER = 'http://localhost:5001';

        async function checkAll() {
            // Check Backend & DB via Manager
            try {
                const res = await fetch(`${MANAGER}/status`);
                const data = await res.json();
                const isOnline = data.status === 'online';
                
                updateStatus('back', isOnline);
                updateStatus('db', isOnline);
                
                document.getElementById('btn-start').disabled = isOnline;
                document.getElementById('btn-stop').disabled = !isOnline;
                document.getElementById('power-desc').innerText = isOnline ? 'Backend operando normalmente' : 'O servidor está desligado';
            } catch (e) {
                updateStatus('back', false);
                updateStatus('db', false);
                document.getElementById('btn-start').disabled = false;
                document.getElementById('btn-stop').disabled = true;
            }

            // Check Frontend
            try {
                const res = await fetch(window.location.href, { method: 'HEAD' });
                updateStatus('front', res.ok);
            } catch (e) {
                updateStatus('front', false);
            }
        }

        function updateStatus(id, online) {
            const dot = document.getElementById(`dot-${id}`);
            const val = document.getElementById(`val-${id}`);
            dot.className = `status-dot ${online ? 'online' : 'offline'}`;
            val.innerText = online ? 'ONLINE' : 'OFFLINE';
            val.style.color = online ? 'var(--success)' : 'var(--danger)';
        }

        async function power(action) {
            const desc = document.getElementById('power-desc');
            desc.innerText = action === 'start' ? 'Iniciando processo...' : 'Encerrando processo...';
            try {
                await fetch(`${MANAGER}/${action}`, { method: 'POST' });
                setTimeout(checkAll, 2000);
            } catch (e) {
                alert('Erro ao comunicar com o Gerenciador.');
                checkAll();
            }
        }

        checkAll();
        setInterval(checkAll, 5000);