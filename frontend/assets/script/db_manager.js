
const API = 'http://localhost:5000/api/db';
    let currentBackups = [];
    let rawData = {};

    async function loadBackups() {
        try {
            const res = await fetch(`${API}/backups`);
            currentBackups = await res.json();
            renderBackups();
        } catch (e) { console.error('Erro ao carregar backups'); }
    }

    function renderBackups() {
        const list = document.getElementById('backup-list');
        document.getElementById('backup-count').innerText = currentBackups.length;
        list.innerHTML = '';
        
        currentBackups.forEach(db => {
            const item = document.createElement('div');
            item.className = `backup-item ${db.current ? 'active' : ''}`;
            item.innerHTML = `
                <span class="backup-name">${db.name} ${db.current ? '<span class="badge badge-current">Ativo</span>' : ''}</span>
                <div class="backup-meta">
                    <span>${db.size}</span>
                    <span>${db.modified}</span>
                </div>
                <div style="margin-top: 10px; display: flex; gap: 8px;">
                    ${!db.current ? `<button class="btn" style="padding: 4px 8px; font-size: 0.7rem;" onclick="switchDB('${db.name}')">Alternar</button>` : ''}
                    ${!db.current ? `<button class="btn btn-danger" style="padding: 4px 8px; font-size: 0.7rem;" onclick="deleteDB('${db.name}')">Excluir</button>` : ''}
                </div>
            `;
            list.appendChild(item);
        });
    }

    async function loadRawData() {
        try {
            const res = await fetch(`${API}/raw`);
            rawData = await res.json();
            renderTabs();
        } catch (e) { console.error('Erro ao carregar dados brutos'); }
    }

    function renderTabs() {
        const tabs = document.getElementById('table-tabs');
        tabs.innerHTML = '';
        
        const tableNames = Object.keys(rawData).sort();
        
        tableNames.forEach((tableName, index) => {
            const tab = document.createElement('div');
            tab.className = `tab ${index === 0 ? 'active' : ''}`;
            tab.innerHTML = `<span>${tableName}</span> <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>`;
            tab.onclick = () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderTable(tableName);
            };
            tabs.appendChild(tab);
            if (index === 0) renderTable(tableName);
        });
    }

    function renderTable(tableName) {
        const data = rawData[tableName];
        const head = document.getElementById('table-head');
        const body = document.getElementById('table-body');
        document.getElementById('current-table-title').innerText = `Tabela: ${tableName}`;
        
        if (!data || !data.columns) return;

        head.innerHTML = `<tr>${data.columns.map(c => `<th>${c}</th>`).join('')}<th>Ações</th></tr>`;
        body.innerHTML = data.rows.map(row => `
            <tr>
                ${data.columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
                <td class="actions-cell">
                    <button class="icon-btn" onclick="alert('Função de edição direta em desenvolvimento')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                    </button>
                    <button class="icon-btn delete" onclick="alert('Para excluir, use o Painel ADM por segurança')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async function createBackup() {
        if (confirm('Deseja criar um snapshot do banco de dados atual?')) {
            const res = await fetch(`${API}/backup`, { method: 'POST' });
            const data = await res.json();
            alert(data.message || data.error);
            loadBackups();
        }
    }

    async function switchDB(name) {
        if (confirm(`Deseja alternar para o banco "${name}"? O site passará a usar estes dados.`)) {
            const res = await fetch(`${API}/switch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            alert(data.message || data.error);
            location.reload();
        }
    }

    async function deleteDB(name) {
        if (confirm(`AVISO: Deseja excluir permanentemente o banco "${name}"? Esta ação não pode ser desfeita.`)) {
            const res = await fetch(`${API}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await res.json();
            alert(data.message || data.error);
            loadBackups();
        }
    }

    loadBackups();
    loadRawData();