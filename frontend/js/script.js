document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.API_BASE_URL || '';
    const apiFetch = (path, options) => fetch(`${API_BASE_URL}${path}`, options);

    const flags = {
        'MÉXICO': 'mx', 'SUDÁFRICA': 'za', 'COREA DEL SUR': 'kr', 'REPÚBLICA CHECA': 'cz',
        'CANADÁ': 'ca', 'BOSNIA HERZEGOVINA': 'ba', 'E.E.U.U.': 'us', 'PARAGUAY': 'py',
        'CATAR': 'qa', 'SUIZA': 'ch', 'BRASIL': 'br', 'MARRUECOS': 'ma',
        'HAITÍ': 'ht', 'ESCOCIA': 'gb-sct', 'AUSTRALIA': 'au', 'TURQUÍA': 'tr',
        'ALEMANIA': 'de', 'CURAZAO': 'cw', 'PAÍSES BAJOS': 'nl', 'JAPÓN': 'jp',
        'COSTA DE MARFIL': 'ci', 'ECUADOR': 'ec', 'SUECIA': 'se', 'TÚNEZ': 'tn',
        'ESPAÑA': 'es', 'CABO VERDE': 'cv', 'BÉLGICA': 'be', 'EGIPTO': 'eg',
        'ARABIA SAUDÍ': 'sa', 'URUGUAY': 'uy', 'IRÁN': 'ir', 'NUEVA ZELANDA': 'nz',
        'FRANCIA': 'fr', 'SENEGAL': 'sn', 'IRAK': 'iq', 'NORUEGA': 'no',
        'ARGENTINA': 'ar', 'ARGELIA': 'dz', 'AUSTRIA': 'at', 'JORDANIA': 'jo',
        'PORTUGAL': 'pt', 'RD CONGO': 'cd', 'INGLATERRA': 'gb-eng', 'CROACIA': 'hr',
        'GHANA': 'gh', 'PANAMÁ': 'pa', 'UZBEKISTÁN': 'uz', 'COLOMBIA': 'co'
    };

    const schedule = {
        j1: [
            ['11/06 3:00pm', 'MÉXICO', 'SUDÁFRICA'], ['11/06 10:00pm', 'COREA DEL SUR', 'REPÚBLICA CHECA'],
            ['12/06 3:00pm', 'CANADÁ', 'BOSNIA HERZEGOVINA'], ['12/06 9:00pm', 'E.E.U.U.', 'PARAGUAY'],
            ['13/06 3:00pm', 'CATAR', 'SUIZA'], ['13/06 6:00pm', 'BRASIL', 'MARRUECOS'],
            ['13/06 9:00pm', 'HAITÍ', 'ESCOCIA'], ['14/06 12:00am', 'AUSTRALIA', 'TURQUÍA'],
            ['14/06 1:00pm', 'ALEMANIA', 'CURAZAO'], ['14/06 4:00pm', 'PAÍSES BAJOS', 'JAPÓN'],
            ['14/06 7:00pm', 'COSTA DE MARFIL', 'ECUADOR'], ['14/06 10:00pm', 'SUECIA', 'TÚNEZ'],
            ['15/06 12:00pm', 'ESPAÑA', 'CABO VERDE'], ['15/06 3:00pm', 'BÉLGICA', 'EGIPTO'],
            ['15/06 6:00pm', 'ARABIA SAUDÍ', 'URUGUAY'], ['15/06 9:00pm', 'IRÁN', 'NUEVA ZELANDA'],
            ['16/06 3:00pm', 'FRANCIA', 'SENEGAL'], ['16/06 6:00pm', 'IRAK', 'NORUEGA'],
            ['16/06 9:00pm', 'ARGENTINA', 'ARGELIA'], ['17/06 12:00am', 'AUSTRIA', 'JORDANIA'],
            ['17/06 1:00pm', 'PORTUGAL', 'RD CONGO'], ['17/06 4:00pm', 'INGLATERRA', 'CROACIA'],
            ['17/06 7:00pm', 'GHANA', 'PANAMÁ'], ['17/06 10:00pm', 'UZBEKISTÁN', 'COLOMBIA']
        ],
        j2: [
            ['18/06 12:00pm', 'REPÚBLICA CHECA', 'SUDÁFRICA'], ['18/06 3:00pm', 'SUIZA', 'BOSNIA HERZEGOVINA'],
            ['18/06 6:00pm', 'CANADÁ', 'CATAR'], ['18/06 9:00pm', 'MÉXICO', 'COREA DEL SUR'],
            ['19/06 3:00pm', 'E.E.U.U.', 'AUSTRALIA'], ['19/06 6:00pm', 'ESCOCIA', 'MARRUECOS'],
            ['19/06 8:30pm', 'BRASIL', 'HAITÍ'], ['19/06 11:00pm', 'TURQUÍA', 'PARAGUAY'],
            ['20/06 1:00pm', 'PAÍSES BAJOS', 'SUECIA'], ['20/06 4:00pm', 'ALEMANIA', 'COSTA DE MARFIL'],
            ['20/06 8:00pm', 'ECUADOR', 'CURAZAO'], ['21/06 12:00am', 'TÚNEZ', 'JAPÓN'],
            ['21/06 12:00pm', 'ESPAÑA', 'ARABIA SAUDÍ'], ['21/06 3:00pm', 'BÉLGICA', 'IRÁN'],
            ['21/06 6:00pm', 'URUGUAY', 'CABO VERDE'], ['21/06 9:00pm', 'NUEVA ZELANDA', 'EGIPTO'],
            ['22/06 1:00pm', 'ARGENTINA', 'AUSTRIA'], ['22/06 5:00pm', 'FRANCIA', 'IRAK'],
            ['22/06 8:00pm', 'NORUEGA', 'SENEGAL'], ['22/06 11:00pm', 'JORDANIA', 'ARGELIA'],
            ['23/06 1:00pm', 'PORTUGAL', 'UZBEKISTÁN'], ['23/06 4:00pm', 'INGLATERRA', 'GHANA'],
            ['23/06 7:00pm', 'PANAMÁ', 'CROACIA'], ['23/06 10:00pm', 'COLOMBIA', 'RD CONGO']
        ],
        j3: [
            ['24/06 3:00pm', 'BOSNIA HERZEGOVINA', 'CATAR'], ['24/06 3:00pm', 'SUIZA', 'CANADÁ'],
            ['24/06 6:00pm', 'ESCOCIA', 'BRASIL'], ['24/06 6:00pm', 'MARRUECOS', 'HAITÍ'],
            ['24/06 9:00pm', 'REPÚBLICA CHECA', 'MÉXICO'], ['24/06 9:00pm', 'SUDÁFRICA', 'COREA DEL SUR'],
            ['25/06 4:00pm', 'CURAZAO', 'COSTA DE MARFIL'], ['25/06 4:00pm', 'ECUADOR', 'ALEMANIA'],
            ['25/06 7:00pm', 'JAPÓN', 'SUECIA'], ['25/06 7:00pm', 'TÚNEZ', 'PAÍSES BAJOS'],
            ['25/06 10:00pm', 'PARAGUAY', 'AUSTRALIA'], ['25/06 10:00pm', 'TURQUÍA', 'E.E.U.U.'],
            ['26/06 3:00pm', 'NORUEGA', 'FRANCIA'], ['26/06 3:00pm', 'SENEGAL', 'IRAK'],
            ['26/06 8:00pm', 'CABO VERDE', 'ARABIA SAUDÍ'], ['26/06 8:00pm', 'URUGUAY', 'ESPAÑA'],
            ['26/06 11:00pm', 'EGIPTO', 'IRÁN'], ['26/06 11:00pm', 'NUEVA ZELANDA', 'BÉLGICA'],
            ['27/06 5:00pm', 'CROACIA', 'GHANA'], ['27/06 5:00pm', 'PANAMÁ', 'INGLATERRA'],
            ['27/06 7:30pm', 'COLOMBIA', 'PORTUGAL'], ['27/06 7:30pm', 'RD CONGO', 'UZBEKISTÁN'],
            ['27/06 10:00pm', 'ARGELIA', 'AUSTRIA'], ['27/06 10:00pm', 'JORDANIA', 'ARGENTINA']
        ]
    };

    function generateMatches() {
        Object.keys(schedule).forEach(jKey => {
            const containerId = `groups-container-${jKey}`;
            const container = document.getElementById(containerId);
            schedule[jKey].forEach((match, index) => {
                const [time, t1, t2] = match;
                const matchId = `${jKey.toUpperCase()}${index + 1}`;
                const flag1 = flags[t1] || 'un';
                const flag2 = flags[t2] || 'un';
                const html = `
                    <tr class="match-row-tr" data-match="${matchId}">
                        <td class="td-date">${time}</td>
                        <td class="td-team">
                            <img src="https://flagcdn.com/w40/${flag1}.png" class="flag-icon" alt="${t1}">
                            <span>${t1}</span>
                        </td>
                        <td class="td-score">
                            <div class="score-inputs-container">
                                <input type="number" class="score-input" data-team="${t1}" min="0" value="0">
                                <span>-</span>
                                <input type="number" class="score-input" data-team="${t2}" min="0" value="0">
                            </div>
                        </td>
                        <td class="td-team right">
                            <img src="https://flagcdn.com/w40/${flag2}.png" class="flag-icon" alt="${t2}">
                            <span>${t2}</span>
                        </td>
                        <td class="td-stadium">Por definir</td>
                    </tr>
                `;
                container.insertAdjacentHTML('beforeend', html);
            });
        });
    }

    generateMatches();

    // Tabs Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // Handle Form Submission
    const form = document.getElementById('quiniela-form');
    const messageBox = document.getElementById('message-box');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('full-name').value;
        const phone = document.getElementById('phone').value;

        if (!name || !phone) {
            showMessage('Faltan datos de contacto', 'error');
            return;
        }

        const predictions = [];
        document.querySelectorAll('.match-row-tr').forEach(row => {
            const inputs = row.querySelectorAll('.score-input');
            predictions.push({
                matchId: row.dataset.match,
                team1: inputs[0].dataset.team,
                score1: inputs[0].value,
                team2: inputs[1].dataset.team,
                score2: inputs[1].value
            });
        });

        try {
            const res = await apiFetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, predictions })
            });

            if (res.ok) {
                showMessage('✅ Quiniela enviada con éxito! Recargando...', 'success');
                form.reset();
                setTimeout(() => location.reload(), 2500);
            } else {
                const errorData = await res.json();
                showMessage(`❌ ${errorData.error || 'Error al enviar'}`, 'error');
            }
        } catch (err) {
            showMessage('❌ Error de conexión', 'error');
        }
    });

    function showMessage(msg, type) {
        messageBox.textContent = msg;
        messageBox.className = type;
        messageBox.style.display = 'block';
        setTimeout(() => messageBox.style.display = 'none', 4000);
    }
});
