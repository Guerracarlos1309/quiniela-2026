document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = window.API_BASE_URL || "";
  const apiFetch = (path, options) => fetch(`${API_BASE_URL}${path}`, options);

  const flags = {
    MÉXICO: "mx",
    SUDÁFRICA: "za",
    "COREA DEL SUR": "kr",
    "REPÚBLICA CHECA": "cz",
    CANADÁ: "ca",
    "BOSNIA HERZEGOVINA": "ba",
    "E.E.U.U.": "us",
    PARAGUAY: "py",
    CATAR: "qa",
    SUIZA: "ch",
    BRASIL: "br",
    MARRUECOS: "ma",
    HAITÍ: "ht",
    ESCOCIA: "gb-sct",
    AUSTRALIA: "au",
    TURQUÍA: "tr",
    ALEMANIA: "de",
    CURAZAO: "cw",
    "PAÍSES BAJOS": "nl",
    JAPÓN: "jp",
    "COSTA DE MARFIL": "ci",
    ECUADOR: "ec",
    SUECIA: "se",
    TÚNEZ: "tn",
    ESPAÑA: "es",
    "CABO VERDE": "cv",
    BÉLGICA: "be",
    EGIPTO: "eg",
    "ARABIA SAUDÍ": "sa",
    URUGUAY: "uy",
    IRÁN: "ir",
    "NUEVA ZELANDA": "nz",
    FRANCIA: "fr",
    SENEGAL: "sn",
    IRAK: "iq",
    NORUEGA: "no",
    ARGENTINA: "ar",
    ARGELIA: "dz",
    AUSTRIA: "at",
    JORDANIA: "jo",
    PORTUGAL: "pt",
    "RD CONGO": "cd",
    INGLATERRA: "gb-eng",
    CROACIA: "hr",
    GHANA: "gh",
    PANAMÁ: "pa",
    UZBEKISTÁN: "uz",
    COLOMBIA: "co",
  };

  const groupsData = {
    "A": ["MÉXICO", "SUDÁFRICA", "COREA DEL SUR", "REPÚBLICA CHECA"],
    "B": ["CANADÁ", "BOSNIA HERZEGOVINA", "CATAR", "SUIZA"],
    "C": ["BRASIL", "MARRUECOS", "HAITÍ", "ESCOCIA"],
    "D": ["E.E.U.U.", "PARAGUAY", "AUSTRALIA", "TURQUÍA"],
    "E": ["ALEMANIA", "CURAZAO", "COSTA DE MARFIL", "ECUADOR"],
    "F": ["PAÍSES BAJOS", "JAPÓN", "SUECIA", "TÚNEZ"],
    "G": ["BÉLGICA", "EGIPTO", "IRÁN", "NUEVA ZELANDA"],
    "H": ["ESPAÑA", "CABO VERDE", "ARABIA SAUDÍ", "URUGUAY"],
    "I": ["FRANCIA", "SENEGAL", "IRAK", "NORUEGA"],
    "J": ["ARGENTINA", "ARGELIA", "AUSTRIA", "JORDANIA"],
    "K": ["PORTUGAL", "RD CONGO", "UZBEKISTÁN", "COLOMBIA"],
    "L": ["INGLATERRA", "CROACIA", "GHANA", "PANAMÁ"]
  };

  const matchesByGroup = {
    "A": [
      ["11/06 3:00pm", "MÉXICO", "SUDÁFRICA"],
      ["11/06 10:00pm", "COREA DEL SUR", "REPÚBLICA CHECA"],
      ["18/06 9:00pm", "MÉXICO", "COREA DEL SUR"],
      ["18/06 12:00pm", "REPÚBLICA CHECA", "SUDÁFRICA"],
      ["24/06 9:00pm", "REPÚBLICA CHECA", "MÉXICO"],
      ["24/06 9:00pm", "SUDÁFRICA", "COREA DEL SUR"]
    ],
    "B": [
      ["12/06 3:00pm", "CANADÁ", "BOSNIA HERZEGOVINA"],
      ["13/06 3:00pm", "CATAR", "SUIZA"],
      ["18/06 3:00pm", "SUIZA", "BOSNIA HERZEGOVINA"],
      ["18/06 6:00pm", "CANADÁ", "CATAR"],
      ["24/06 3:00pm", "BOSNIA HERZEGOVINA", "CATAR"],
      ["24/06 3:00pm", "SUIZA", "CANADÁ"]
    ],
    "C": [
      ["13/06 6:00pm", "BRASIL", "MARRUECOS"],
      ["13/06 9:00pm", "HAITÍ", "ESCOCIA"],
      ["19/06 6:00pm", "ESCOCIA", "MARRUECOS"],
      ["19/06 8:30pm", "BRASIL", "HAITÍ"],
      ["24/06 6:00pm", "ESCOCIA", "BRASIL"],
      ["24/06 6:00pm", "MARRUECOS", "HAITÍ"]
    ],
    "D": [
      ["12/06 9:00pm", "E.E.U.U.", "PARAGUAY"],
      ["14/06 12:00am", "AUSTRALIA", "TURQUÍA"],
      ["19/06 3:00pm", "E.E.U.U.", "AUSTRALIA"],
      ["19/06 11:00pm", "TURQUÍA", "PARAGUAY"],
      ["25/06 10:00pm", "PARAGUAY", "AUSTRALIA"],
      ["25/06 10:00pm", "TURQUÍA", "E.E.U.U."]
    ],
    "E": [
      ["14/06 1:00pm", "ALEMANIA", "CURAZAO"],
      ["14/06 7:00pm", "COSTA DE MARFIL", "ECUADOR"],
      ["20/06 4:00pm", "ALEMANIA", "COSTA DE MARFIL"],
      ["20/06 8:00pm", "ECUADOR", "CURAZAO"],
      ["25/06 4:00pm", "CURAZAO", "COSTA DE MARFIL"],
      ["25/06 4:00pm", "ECUADOR", "ALEMANIA"]
    ],
    "F": [
      ["14/06 4:00pm", "PAÍSES BAJOS", "JAPÓN"],
      ["14/06 10:00pm", "SUECIA", "TÚNEZ"],
      ["20/06 1:00pm", "PAÍSES BAJOS", "SUECIA"],
      ["21/06 12:00am", "TÚNEZ", "JAPÓN"],
      ["25/06 7:00pm", "JAPÓN", "SUECIA"],
      ["25/06 7:00pm", "TÚNEZ", "PAÍSES BAJOS"]
    ],
    "G": [
      ["15/06 3:00pm", "BÉLGICA", "EGIPTO"],
      ["15/06 9:00pm", "IRÁN", "NUEVA ZELANDA"],
      ["21/06 3:00pm", "BÉLGICA", "IRÁN"],
      ["21/06 9:00pm", "NUEVA ZELANDA", "EGIPTO"],
      ["26/06 11:00pm", "EGIPTO", "IRÁN"],
      ["26/06 11:00pm", "NUEVA ZELANDA", "BÉLGICA"]
    ],
    "H": [
      ["15/06 12:00pm", "ESPAÑA", "CABO VERDE"],
      ["15/06 6:00pm", "ARABIA SAUDÍ", "URUGUAY"],
      ["21/06 12:00pm", "ESPAÑA", "ARABIA SAUDÍ"],
      ["21/06 6:00pm", "URUGUAY", "CABO VERDE"],
      ["26/06 8:00pm", "CABO VERDE", "ARABIA SAUDÍ"],
      ["26/06 8:00pm", "URUGUAY", "ESPAÑA"]
    ],
    "I": [
      ["16/06 3:00pm", "FRANCIA", "SENEGAL"],
      ["16/06 6:00pm", "IRAK", "NORUEGA"],
      ["22/06 5:00pm", "FRANCIA", "IRAK"],
      ["22/06 8:00pm", "NORUEGA", "SENEGAL"],
      ["26/06 3:00pm", "NORUEGA", "FRANCIA"],
      ["26/06 3:00pm", "SENEGAL", "IRAK"]
    ],
    "J": [
      ["16/06 9:00pm", "ARGENTINA", "ARGELIA"],
      ["17/06 12:00am", "AUSTRIA", "JORDANIA"],
      ["22/06 1:00pm", "ARGENTINA", "AUSTRIA"],
      ["22/06 11:00pm", "JORDANIA", "ARGELIA"],
      ["27/06 10:00pm", "ARGELIA", "AUSTRIA"],
      ["27/06 10:00pm", "JORDANIA", "ARGENTINA"]
    ],
    "K": [
      ["17/06 1:00pm", "PORTUGAL", "RD CONGO"],
      ["17/06 10:00pm", "UZBEKISTÁN", "COLOMBIA"],
      ["23/06 1:00pm", "PORTUGAL", "UZBEKISTÁN"],
      ["23/06 10:00pm", "COLOMBIA", "RD CONGO"],
      ["27/06 7:30pm", "COLOMBIA", "PORTUGAL"],
      ["27/06 7:30pm", "RD CONGO", "UZBEKISTÁN"]
    ],
    "L": [
      ["17/06 4:00pm", "INGLATERRA", "CROACIA"],
      ["17/06 7:00pm", "GHANA", "PANAMÁ"],
      ["23/06 4:00pm", "INGLATERRA", "GHANA"],
      ["23/06 7:00pm", "PANAMÁ", "CROACIA"],
      ["27/06 5:00pm", "CROACIA", "GHANA"],
      ["27/06 5:00pm", "PANAMÁ", "INGLATERRA"]
    ]
  };

  function generateMatches() {
    const groupsWrapper = document.getElementById("groups-wrapper");
    const tabsContainer = document.getElementById("groups-tabs");
    groupsWrapper.innerHTML = "";
    tabsContainer.innerHTML = "";

    Object.keys(matchesByGroup).forEach((group, gIdx) => {
      // Create Tab Button
      const btn = document.createElement("button");
      btn.className = `tab-btn ${gIdx === 0 ? "active" : ""}`;
      btn.dataset.tab = `group-${group}`;
      btn.textContent = `Grupo ${group}`;
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(`group-${group}`).classList.add("active");
      });
      tabsContainer.appendChild(btn);
    });

    // Soporte para scroll horizontal con la rueda del ratón en escritorio
    tabsContainer.addEventListener("wheel", (evt) => {
      evt.preventDefault();
      tabsContainer.scrollLeft += evt.deltaY;
    });

    Object.keys(matchesByGroup).forEach((group, gIdx) => {
      // Create Group Content
      const groupDiv = document.createElement("div");
      groupDiv.id = `group-${group}`;
      groupDiv.className = `tab-content ${gIdx === 0 ? "active" : ""}`;

      let matchesHtml = "";
      matchesByGroup[group].forEach((match, mIdx) => {
        const [time, t1, t2] = match;
        const matchId = `G${group}_M${mIdx + 1}`;
        const flag1 = flags[t1] || "un";
        const flag2 = flags[t2] || "un";
        matchesHtml += `
          <tr class="match-row-tr" data-match="${matchId}" data-group="${group}">
            <td class="td-date">${time}</td>
            <td class="td-team">
              <img src="https://flagcdn.com/w40/${flag1}.png" class="flag-icon" alt="${t1}">
              <span>${t1}</span>
            </td>
            <td class="td-score">
              <div class="score-inputs-container">
                <input type="number" class="score-input" data-team="${t1}" data-group="${group}" min="0" max="20" placeholder="0">
                <span>-</span>
                <input type="number" class="score-input" data-team="${t2}" data-group="${group}" min="0" max="20" placeholder="0">
              </div>
            </td>
            <td class="td-team right">
              <img src="https://flagcdn.com/w40/${flag2}.png" class="flag-icon" alt="${t2}">
              <span>${t2}</span>
            </td>
            <td class="td-stadium">Por definir</td>
          </tr>
        `;
      });

      const standingsHtml = `
        <div class="standings-container">
          <table class="standings-table" id="standings-${group}">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>JJ</th>
                <th>G</th>
                <th>E</th>
                <th>P</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              ${groupsData[group].map(team => `
                <tr data-team="${team}">
                  <td class="std-team">
                    <img src="https://flagcdn.com/w20/${flags[team] || "un"}.png" alt="">
                    ${team}
                  </td>
                  <td class="std-jj">0</td>
                  <td class="std-g">0</td>
                  <td class="std-e">0</td>
                  <td class="std-p">0</td>
                  <td class="std-pts">0</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;

      groupDiv.innerHTML = `
        <div class="group-section-title">Resultados del Grupo ${group}</div>
        ${standingsHtml}
        <table class="matches-table">
          <thead>
            <tr>
              <th>Fecha y Hora</th>
              <th>Local</th>
              <th style="align:center">Resultado</th>
              <th>Visitante</th>
              <th>Estadio</th>
            </tr>
          </thead>
          <tbody>${matchesHtml}</tbody>
        </table>
      `;

      groupsWrapper.appendChild(groupDiv);
    });
  }

  function updateStandings(group) {
    const teams = groupsData[group];
    const standings = {};
    teams.forEach(t => {
      standings[t] = { jj: 0, g: 0, e: 0, p: 0, pts: 0 };
    });

    const rows = document.querySelectorAll(`.match-row-tr[data-group="${group}"]`);
    rows.forEach(row => {
      const inputs = row.querySelectorAll(".score-input");
      const s1 = inputs[0].value;
      const s2 = inputs[1].value;

      if (s1 !== "" && s2 !== "") {
        const team1 = inputs[0].dataset.team;
        const team2 = inputs[1].dataset.team;
        const score1 = parseInt(s1, 10);
        const score2 = parseInt(s2, 10);

        standings[team1].jj++;
        standings[team2].jj++;

        if (score1 > score2) {
          standings[team1].g++;
          standings[team1].pts += 3;
          standings[team2].p++;
        } else if (score1 < score2) {
          standings[team2].g++;
          standings[team2].pts += 3;
          standings[team1].p++;
        } else {
          standings[team1].e++;
          standings[team1].pts += 1;
          standings[team2].e++;
          standings[team2].pts += 1;
        }
      }
    });

    // Update UI
    const sortedTeams = Object.keys(standings).sort((a,b) => standings[b].pts - standings[a].pts);
    const tbody = document.querySelector(`#standings-${group} tbody`);
    tbody.innerHTML = "";
    sortedTeams.forEach(team => {
      const s = standings[team];
      tbody.insertAdjacentHTML("beforeend", `
        <tr data-team="${team}">
          <td class="std-team">
            <img src="https://flagcdn.com/w20/${flags[team] || "un"}.png" alt="">
            ${team}
          </td>
          <td>${s.jj}</td>
          <td>${s.g}</td>
          <td>${s.e}</td>
          <td>${s.p}</td>
          <td class="std-pts-val">${s.pts}</td>
        </tr>
      `);
    });
  }

  generateMatches();
 
  // Restringir los inputs de score (Solo enteros 0-20, sin signos ni decimales)
  document.addEventListener("keydown", (e) => {
    if (e.target.classList.contains("score-input")) {
      const invalidChars = [".", ",", "-", "+", "e"];
      if (invalidChars.includes(e.key)) {
        e.preventDefault();
      }
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.classList.contains("score-input")) {
      const input = e.target;
      
      // Si está vacío, dejarlo vacío (mostrará placeholder)
      if (input.value === "") {
        updateStandings(input.dataset.group);
        return;
      }

      // Eliminar cualquier cosa que no sea dígito
      let valStr = input.value.replace(/\D/g, "");
      
      // Convertir a número para limpiar ceros a la izquierda (05 -> 5)
      let val = parseInt(valStr, 10);
      
      if (isNaN(val)) {
        input.value = "";
      } else {
        if (val > 20) val = 20;
        if (val < 0) val = 0;
        input.value = val;
      }
      
      // Actualizar tabla de posiciones del grupo
      updateStandings(input.dataset.group);
    }
  });

  // Handle Form Submission
  const form = document.getElementById("quiniela-form");
  const messageBox = document.getElementById("message-box");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    // 1. Deshabilitar botón y mostrar loading
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    e.preventDefault();
    const name = document.getElementById("full-name").value;
    const phone = document.getElementById("phone").value;

    if (!name || !phone) {
      showMessage("Faltan datos de contacto", "error");
      return;
    }

    const predictions = [];
    document.querySelectorAll(".match-row-tr").forEach((row) => {
      const inputs = row.querySelectorAll(".score-input");
      predictions.push({
        matchId: row.dataset.match,
        team1: inputs[0].dataset.team,
        score1: inputs[0].value || "0",
        team2: inputs[1].dataset.team,
        score2: inputs[1].value || "0",
      });
    });

    try {
      const res = await apiFetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, predictions }),
      });

      if (res.ok) {
        showMessage("✅ Quiniela enviada con éxito! Recargando...", "success");
        form.reset();
        setTimeout(() => location.reload(), 2500);
      } else {
        const errorData = await res.json();
        showMessage(`❌ ${errorData.error || "Error al enviar"}. Reiniciando...`, "error");
        // Reiniciar página incluso en error después de mostrar el mensaje
        setTimeout(() => location.reload(), 3000);
      }
    } catch (err) {
      console.error(err);
      showMessage("❌ Error de conexión. Reiniciando...", "error");
      // No rehabilitar el botón, resetear página
      setTimeout(() => location.reload(), 3000);
    }
  });

  function showMessage(msg, type) {
    messageBox.textContent = msg;
    messageBox.className = type;
    messageBox.style.display = "block";
    setTimeout(() => (messageBox.style.display = "none"), 4000);
  }
});
