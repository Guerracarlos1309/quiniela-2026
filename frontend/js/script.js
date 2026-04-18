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
      ["11/06 15:00", "MÉXICO", "SUDÁFRICA", "Estadio Ciudad de México"],
      ["11/06 22:00", "COREA DEL SUR", "REPÚBLICA CHECA", "Estadio Guadalajara"],
      ["18/06 21:00", "MÉXICO", "COREA DEL SUR", "Estadio Guadalajara"],
      ["18/06 12:00", "REPÚBLICA CHECA", "SUDÁFRICA", "Estadio Atlanta"],
      ["24/06 21:00", "REPÚBLICA CHECA", "MÉXICO", "Estadio Ciudad de México"],
      ["24/06 21:00", "SUDÁFRICA", "COREA DEL SUR", "Estadio Monterrey"]
    ],
    "B": [
      ["12/06 15:00", "CANADÁ", "BOSNIA HERZEGOVINA", "Estadio Toronto"],
      ["13/06 15:00", "CATAR", "SUIZA", "Estadio Bahía de San Francisco"],
      ["18/06 15:00", "SUIZA", "BOSNIA HERZEGOVINA", "Estadio Los Ángeles"],
      ["18/06 18:00", "CANADÁ", "CATAR", "Estadio BC Place Vancouver"],
      ["24/06 15:00", "BOSNIA HERZEGOVINA", "CATAR", "Estadio Seattle"],
      ["24/06 15:00", "SUIZA", "CANADÁ", "Estadio BC Place Vancouver"]
    ],
    "C": [
      ["13/06 18:00", "BRASIL", "MARRUECOS", "Estadio Nueva York Nueva Jersey"],
      ["13/06 21:00", "HAITÍ", "ESCOCIA", "Estadio Boston"],
      ["19/06 18:00", "ESCOCIA", "MARRUECOS", "Estadio Boston"],
      ["19/06 21:00", "BRASIL", "HAITÍ", "Estadio Filadelfia"],
      ["24/06 18:00", "ESCOCIA", "BRASIL", "Estadio Miami"],
      ["24/06 18:00", "MARRUECOS", "HAITÍ", "Estadio Atlanta"]
    ],
    "D": [
      ["12/06 21:00", "E.E.U.U.", "PARAGUAY", "Estadio Los Ángeles"],
      ["14/06 00:00", "AUSTRALIA", "TURQUÍA", "Estadio BC Place Vancouver"],
      ["19/06 15:00", "E.E.U.U.", "AUSTRALIA", "Estadio Seattle"],
      ["19/06 00:00", "TURQUÍA", "PARAGUAY", "Estadio Bahía de San Francisco"],
      ["25/06 22:00", "PARAGUAY", "AUSTRALIA", "Estadio Bahía de San Francisco"],
      ["25/06 22:00", "TURQUÍA", "E.E.U.U.", "Estadio Los Ángeles"]
    ],
    "E": [
      ["14/06 13:00", "ALEMANIA", "CURAZAO", "Estadio Houston"],
      ["14/06 19:00", "COSTA DE MARFIL", "ECUADOR", "Estadio Filadelfia"],
      ["20/06 16:00", "ALEMANIA", "COSTA DE MARFIL", "Estadio Toronto"],
      ["20/06 22:00", "ECUADOR", "CURAZAO", "Estadio Kansas City"],
      ["25/06 16:00", "CURAZAO", "COSTA DE MARFIL", "Estadio Filadelfia"],
      ["25/06 16:00", "ECUADOR", "ALEMANIA", "Estadio Nueva York Nueva Jersey"]
    ],
    "F": [
      ["14/06 16:00", "PAÍSES BAJOS", "JAPÓN", "Estadio Dallas"],
      ["14/06 22:00", "SUECIA", "TÚNEZ", "Estadio Monterrey"],
      ["20/06 13:00", "PAÍSES BAJOS", "SUECIA", "Estadio Houston"],
      ["20/06 00:00", "TÚNEZ", "JAPÓN", "Estadio Monterrey"],
      ["25/06 19:00", "JAPÓN", "SUECIA", "Estadio Dallas"],
      ["25/06 19:00", "TÚNEZ", "PAÍSES BAJOS", "Estadio Kansas City"]
    ],
    "G": [
      ["15/06 15:00", "BÉLGICA", "EGIPTO", "Estadio Seattle"],
      ["15/06 21:00", "IRÁN", "NUEVA ZELANDA", "Estadio Los Ángeles"],
      ["21/06 15:00", "BÉLGICA", "IRÁN", "Estadio Los Ángeles"],
      ["21/06 21:00", "NUEVA ZELANDA", "EGIPTO", "Estadio BC Place Vancouver"],
      ["26/06 23:00", "EGIPTO", "IRÁN", "Estadio Seattle"],
      ["26/06 23:00", "NUEVA ZELANDA", "BÉLGICA", "Estadio BC Place Vancouver"]
    ],
    "H": [
      ["15/06 12:00", "ESPAÑA", "CABO VERDE", "Estadio Atlanta"],
      ["15/06 18:00", "ARABIA SAUDÍ", "URUGUAY", "Estadio Miami"],
      ["21/06 12:00", "ESPAÑA", "ARABIA SAUDÍ", "Estadio Atlanta"],
      ["21/06 18:00", "URUGUAY", "CABO VERDE", "Estadio Miami"],
      ["26/06 20:00", "CABO VERDE", "ARABIA SAUDÍ", "Estadio Houston"],
      ["26/06 20:00", "URUGUAY", "ESPAÑA", "Estadio Guadalajara"]
    ],
    "I": [
      ["16/06 15:00", "FRANCIA", "SENEGAL", "Estadio Nueva York Nueva Jersey"],
      ["16/06 18:00", "IRAK", "NORUEGA", "Estadio Boston"],
      ["22/06 17:00", "FRANCIA", "IRAK", "Estadio Filadelfia"],
      ["22/06 20:00", "NORUEGA", "SENEGAL", "Estadio Nueva York Nueva Jersey"],
      ["26/06 15:00", "NORUEGA", "FRANCIA", "Estadio Boston"],
      ["26/06 15:00", "SENEGAL", "IRAK", "Estadio Toronto"]
    ],
    "J": [
      ["16/06 21:00", "ARGENTINA", "ARGELIA", "Estadio Kansas City"],
      ["16/06 00:00", "AUSTRIA", "JORDANIA", "Estadio Bahía de San Francisco"],
      ["22/06 13:00", "ARGENTINA", "AUSTRIA", "Estadio Dallas"],
      ["22/06 23:00", "JORDANIA", "ARGELIA", "Estadio Bahía de San Francisco"],
      ["27/06 22:00", "ARGELIA", "AUSTRIA", "Estadio Kansas City"],
      ["27/06 22:00", "JORDANIA", "ARGENTINA", "Estadio Dallas"]
    ],
    "K": [
      ["17/06 13:00", "PORTUGAL", "RD CONGO", "Estadio Houston"],
      ["17/06 22:00", "UZBEKISTÁN", "COLOMBIA", "Estadio Ciudad de México"],
      ["23/06 13:00", "PORTUGAL", "UZBEKISTÁN", "Estadio Houston"],
      ["23/06 22:00", "COLOMBIA", "RD CONGO", "Estadio Guadalajara"],
      ["27/06 19:30", "COLOMBIA", "PORTUGAL", "Estadio Miami"],
      ["27/06 19:30", "RD CONGO", "UZBEKISTÁN", "Estadio Atlanta"]
    ],
    "L": [
      ["17/06 16:00", "INGLATERRA", "CROACIA", "Estadio Dallas"],
      ["17/06 19:00", "GHANA", "PANAMÁ", "Estadio Toronto"],
      ["23/06 16:00", "INGLATERRA", "GHANA", "Estadio Boston"],
      ["23/06 19:00", "PANAMÁ", "CROACIA", "Estadio Toronto"],
      ["27/06 17:00", "PANAMÁ", "INGLATERRA", "Estadio Nueva York Nueva Jersey"],
      ["27/06 17:00", "CROACIA", "GHANA", "Estadio Filadelfia"]
    ]
  };

  let currentUser = null;
  let userToken = localStorage.getItem("quiniela_token");
  let predictionsLocked = false;

  function generateMatches(userPredictions = null) {
    const groupsWrapper = document.getElementById("groups-wrapper");
    const tabsContainer = document.getElementById("groups-tabs");
    groupsWrapper.innerHTML = "";
    tabsContainer.innerHTML = "";

    Object.keys(matchesByGroup).forEach((group, gIdx) => {
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

      const groupDiv = document.createElement("div");
      groupDiv.id = `group-${group}`;
      groupDiv.className = `tab-content ${gIdx === 0 ? "active" : ""}`;

      let matchesHtml = "";
      matchesByGroup[group].forEach((match, mIdx) => {
        const [time, t1, t2, stadium] = match;
        const matchId = `G${group}_M${mIdx + 1}`;
        const flag1 = flags[t1] || "un";
        const flag2 = flags[t2] || "un";
        
        let s1 = "", s2 = "";
        if (userPredictions) {
          const pred = userPredictions.find(p => p.match_id === matchId);
          if (pred) {
            s1 = pred.score1;
            s2 = pred.score2;
          }
        }

        matchesHtml += `
          <tr class="match-row-tr" data-match="${matchId}" data-group="${group}">
            <td class="td-date" data-label="Fecha">${time}</td>
            <td class="td-team" data-label="Local">
              <img src="https://flagcdn.com/w40/${flag1}.png" class="flag-icon" alt="${t1}">
              <span>${t1}</span>
            </td>
            <td class="td-score" data-label="Resultado">
              <div class="score-inputs-container">
                <input type="number" class="score-input" data-team="${t1}" data-group="${group}" min="0" max="20" placeholder="0" value="${s1}" ${userPredictions ? 'readonly disabled' : ''}>
                <span>-</span>
                <input type="number" class="score-input" data-team="${t2}" data-group="${group}" min="0" max="20" placeholder="0" value="${s2}" ${userPredictions ? 'readonly disabled' : ''}>
              </div>
            </td>
            <td class="td-team right" data-label="Visitante">
              <img src="https://flagcdn.com/w40/${flag2}.png" class="flag-icon" alt="${t2}">
              <span>${t2}</span>
            </td>
            <td class="td-stadium" data-label="Estadio">${stadium || "Por definir"}</td>
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
                  <td data-label="JJ">0</td>
                  <td data-label="G">0</td>
                  <td data-label="E">0</td>
                  <td data-label="P">0</td>
                  <td data-label="Pts" class="std-pts-val">0</td>
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
              <th>Resultado</th>
              <th>Visitante</th>
              <th>Estadio</th>
            </tr>
          </thead>
          <tbody>${matchesHtml}</tbody>
        </table>
      `;
      groupsWrapper.appendChild(groupDiv);
    });

    Object.keys(matchesByGroup).forEach(group => updateStandings(group));
  }

  function updateStandings(group) {
    const teams = groupsData[group];
    const standings = {};
    teams.forEach(t => { standings[t] = { jj: 0, g: 0, e: 0, p: 0, pts: 0 }; });

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
        standings[team1].jj++; standings[team2].jj++;
        if (score1 > score2) { standings[team1].g++; standings[team1].pts += 3; standings[team2].p++; }
        else if (score1 < score2) { standings[team2].g++; standings[team2].pts += 3; standings[team1].p++; }
        else { standings[team1].e++; standings[team1].pts += 1; standings[team2].e++; standings[team2].pts += 1; }
      }
    });

    const sortedTeams = Object.keys(standings).sort((a,b) => standings[b].pts - standings[a].pts || (standings[b].g - standings[a].g));
    const tbody = document.querySelector(`#standings-${group} tbody`);
    if (!tbody) return;
    tbody.innerHTML = "";
    sortedTeams.forEach(team => {
      const s = standings[team];
      tbody.insertAdjacentHTML("beforeend", `
        <tr data-team="${team}">
          <td class="std-team">
            <img src="https://flagcdn.com/w20/${flags[team] || "un"}.png" alt="">
            ${team}
          </td>
          <td data-label="JJ">${s.jj}</td>
          <td data-label="G">${s.g}</td>
          <td data-label="E">${s.e}</td>
          <td data-label="P">${s.p}</td>
          <td data-label="Pts" class="std-pts-val">${s.pts}</td>
        </tr>
      `);
    });
  }

  const tabsContainer = document.getElementById("groups-tabs");
  tabsContainer.addEventListener("wheel", (evt) => {
    evt.preventDefault();
    tabsContainer.scrollLeft += evt.deltaY;
  });

  async function checkAuth() {
    if (!userToken) {
      showSection("auth");
      return;
    }
    try {
      const res = await apiFetch("/api/user/me", {
        headers: { "Authorization": userToken }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        document.getElementById("user-display-name").textContent = currentUser.name;
        document.getElementById("user-display-phone").textContent = `Tel: ${currentUser.phone}`;
        showSection("main");

        // Set status badge and banner
        const statusBadge = document.getElementById("account-status-badge");
        const statusBanner = document.getElementById("status-banner");
        if (currentUser.is_active) {
          statusBadge.textContent = "Estado: Activo ✅";
          statusBadge.classList.add("active");
          statusBadge.classList.remove("inactive");
          statusBanner.style.display = "none";
        } else {
          statusBadge.textContent = "Estado: En Revisión ⏳";
          statusBadge.classList.add("inactive");
          statusBadge.classList.remove("active");
          statusBanner.style.display = "flex";
        }

        // Fetch settings (lock status)
        try {
          const settingsRes = await apiFetch("/api/settings");
          const settings = await settingsRes.json();
          predictionsLocked = settings.predictions_locked === "true";
        } catch (err) {
          console.error("Error loading settings:", err);
        }

        if (data.predictions && data.predictions.length > 0) {
          if (predictionsLocked) {
            document.getElementById("locked-badge").style.display = "inline-block";
            document.getElementById("read-only-badge").style.display = "none";
            document.getElementById("edit-btn").style.display = "none";
          } else {
            document.getElementById("locked-badge").style.display = "none";
            document.getElementById("read-only-badge").style.display = "inline-block";
            document.getElementById("edit-btn").style.display = "inline-block";
          }
          document.getElementById("submit-section").style.display = "none";
          generateMatches(data.predictions);
        } else {
          if (predictionsLocked) {
             document.getElementById("locked-badge").style.display = "inline-block";
             document.getElementById("submit-section").style.display = "none";
          } else {
             document.getElementById("locked-badge").style.display = "none";
             document.getElementById("submit-section").style.display = "block";
          }
          document.getElementById("read-only-badge").style.display = "none";
          document.getElementById("edit-btn").style.display = "none";
          generateMatches();
        }
      } else {
        logout();
      }
    } catch (err) {
      console.error(err);
      logout();
    }
  }

  function showSection(type) {
    // We no longer have a static auth-section, we use modals.
    // However, we show/hide the guest login buttons in the header.
    const guestActions = document.getElementById("guest-actions");
    if (guestActions) guestActions.style.display = type === "auth" ? "block" : "none";
    
    // Show static rules section only for guests
    const rulesSection = document.getElementById("rules-section");
    if (rulesSection) rulesSection.style.display = type === "auth" ? "block" : "none";

    document.getElementById("main-content").style.display = type === "main" ? "block" : "none";
    if (type === "main") {
      setupUserTabs();
      startSystemPolling();
    } else {
      stopSystemPolling();
    }
  }

  let leaderboardPollInterval = null;
  let settingsPollInterval = null;

  function setupUserTabs() {
    const tabPreds = document.getElementById("tab-predictions");
    const tabLeader = document.getElementById("tab-leaderboard");
    const viewPreds = document.getElementById("predictions-view");
    const viewLeader = document.getElementById("leaderboard-view");

    if (!tabPreds || !tabLeader) return;

    tabPreds.onclick = () => {
      tabPreds.classList.add("active");
      tabLeader.classList.remove("active");
      viewPreds.style.display = "block";
      viewLeader.style.display = "none";
      stopLeaderboardPolling();
    };

    tabLeader.onclick = () => {
      tabLeader.classList.add("active");
      tabPreds.classList.remove("active");
      viewPreds.style.display = "none";
      viewLeader.style.display = "block";
      fetchLeaderboard();
      startLeaderboardPolling();
    };
  }

  function startSystemPolling() {
    // Poll settings every 30 seconds to update lock status
    if (!settingsPollInterval) {
      settingsPollInterval = setInterval(async () => {
        try {
          const res = await apiFetch("/api/settings");
          if (res.ok) {
            const settings = await res.json();
            const locked = settings.predictions_locked === "true";
            if (locked !== predictionsLocked) {
              predictionsLocked = locked;
              // If lock status changed, reload relevant parts of the UI
              checkAuth(); // This will refresh UI based on new lock status
            }
          }
        } catch (e) {}
      }, 30000);
    }
  }

  function stopSystemPolling() {
    if (settingsPollInterval) {
      clearInterval(settingsPollInterval);
      settingsPollInterval = null;
    }
    stopLeaderboardPolling();
  }

  function startLeaderboardPolling() {
    if (!leaderboardPollInterval) {
      leaderboardPollInterval = setInterval(fetchLeaderboard, 60000);
    }
  }

  function stopLeaderboardPolling() {
    if (leaderboardPollInterval) {
      clearInterval(leaderboardPollInterval);
      leaderboardPollInterval = null;
    }
  }

  async function fetchLeaderboard() {
    const container = document.getElementById("leaderboard-container");
    const loading = document.getElementById("leaderboard-loading");
    const updateTimeEl = document.getElementById("leaderboard-updated-at");
    
    // Only show loading spinner on first load
    if (container.innerHTML === "") {
      container.style.display = "none";
      loading.style.display = "block";
    }

    try {
      const res = await apiFetch("/api/leaderboard");
      if (res.ok) {
        const data = await res.json();
        renderLeaderboard(data);
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        updateTimeEl.textContent = `Actualizado: ${timeStr}`;
        updateTimeEl.style.display = "block";
        
        loading.style.display = "none";
        container.style.display = "block";
      } else {
        if (container.innerHTML === "") {
           container.innerHTML = `<p class="msg error">Error al cargar la tabla</p>`;
           container.style.display = "block";
        }
        loading.style.display = "none";
      }
    } catch (err) {
      console.error(err);
      loading.style.display = "none";
    }
  }

  function renderLeaderboard(data) {
    const container = document.getElementById("leaderboard-container");
    
    let html = `
      <table class="standings-table">
        <thead>
          <tr>
            <th>Participante</th>
            <th>Pts</th>
            <th>Exacto (3)</th>
            <th>Resultado (1)</th>
            <th>Fallos (0)</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach((row, index) => {
      const isMe = currentUser && row.name === currentUser.name;
      const rank = index + 1;

      html += `
        <tr class="${isMe ? 'row-is-me' : ''}">
          <td class="std-team" data-label="Participante">
            <span class="rank-id">#${rank}</span>
            <span class="team-name">${row.name}</span>
            ${isMe ? '<span class="badge-me">Tú</span>' : ''}
          </td>
          <td class="std-pts-val" data-label="Puntos Totales">${row.points}</td>
          <td data-label="Aciertos Exactos">${row.exact_hits}</td>
          <td data-label="Aciertos Resultado">${row.outcome_hits}</td>
          <td data-label="Partidos Fallidos">${row.misses}</td>
        </tr>
      `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
  }

  function logout() {
    localStorage.removeItem("quiniela_token");
    userToken = null;
    currentUser = null;
    location.reload();
  }

  const loginModal = document.getElementById("login-modal");
  const regModal = document.getElementById("register-modal");
  const rulesModal = document.getElementById("rules-modal");
  const confirmModal = document.getElementById("confirm-submit-modal");

  document.getElementById("show-login").onclick = () => loginModal.style.display = "flex";
  document.getElementById("show-register").onclick = () => regModal.style.display = "flex";
  
  const rulesBtn = document.getElementById("btn-jump-rules");
  if (rulesBtn) {
    rulesBtn.onclick = () => {
      if (userToken) {
          // Logged in: show modal
          rulesModal.style.display = "flex";
      } else {
          // Guest: scroll to static section
          const rulesSect = document.getElementById("rules-section");
          if (rulesSect) rulesSect.scrollIntoView({ behavior: "smooth" });
      }
    };
  }

  document.querySelectorAll(".close-modal").forEach(span => {
    span.onclick = () => { 
        loginModal.style.display = "none"; 
        regModal.style.display = "none"; 
        rulesModal.style.display = "none";
        confirmModal.style.display = "none";
        document.getElementById("lock-modal").style.display = "none";
    };
  });

  document.querySelectorAll(".close-modal-btn, .close-rules-modal").forEach(btn => {
    btn.onclick = () => { 
        document.getElementById("lock-modal").style.display = "none";
        rulesModal.style.display = "none";
        confirmModal.style.display = "none";
    };
  });

  document.getElementById("login-submit").onclick = async () => {
    const phone = document.getElementById("login-phone").value;
    const pass = document.getElementById("login-pw").value;

    if (!phone || !pass) {
      showMessage("❌ Ingresa tus datos", "error", document.getElementById("login-msg"));
      return;
    }

    const btn = document.getElementById("login-submit");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-mini"></span> Entrando...';

    try {
      const res = await apiFetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password: pass }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("quiniela_token", data.token);
        location.reload();
      } else {
        throw new Error(data.error || "Datos incorrectos");
      }
    } catch (err) {
      showMessage(`❌ ${err.message}`, "error", document.getElementById("login-msg"));
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  };

  document.getElementById("login-pw").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("login-submit").click();
  });

  document.getElementById("register-submit").onclick = async () => {
    const name = document.getElementById("reg-name").value;
    const phone = document.getElementById("reg-phone").value;
    const pass = document.getElementById("reg-pw").value;

    if (!name || !phone || !pass) {
      showMessage("❌ Completa todos los campos", "error", document.getElementById("reg-msg"));
      return;
    }

    const btn = document.getElementById("register-submit");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-mini"></span> Registrando...';

    try {
      const res = await apiFetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password: pass }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("quiniela_token", data.token);
        location.reload();
      } else {
        throw new Error(data.error || "Error al registrar");
      }
    } catch (err) {
      showMessage(`❌ ${err.message}`, "error", document.getElementById("reg-msg"));
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  };

  document.getElementById("reg-pw").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("register-submit").click();
  });

  document.getElementById("logout-btn").onclick = logout;

  // Edit logic
  document.getElementById("edit-btn").onclick = () => {
    if (currentUser && !currentUser.is_active) {
      showMessage("❌ Tu cuenta está en revisión. No puedes realizar cambios aún.", "error");
      return;
    }
    
    if (predictionsLocked) {
        document.getElementById("lock-modal").style.display = "flex";
        return;
    }
    const inputs = document.querySelectorAll(".score-input");
    inputs.forEach(input => {
        input.removeAttribute("readonly");
        input.removeAttribute("disabled");
        input.readOnly = false;
        input.disabled = false;
    });
    document.getElementById("edit-btn").style.display = "none";
    document.getElementById("read-only-badge").style.display = "none";
    document.getElementById("submit-section").style.display = "block";
    const submitBtn = document.querySelector("#submit-section button");
    submitBtn.textContent = "Actualizar Quiniela";
  };

  document.addEventListener("keydown", (e) => {
    if (e.target.classList.contains("score-input")) {
      if ([".", ",", "-", "+", "e"].includes(e.key)) e.preventDefault();
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.classList.contains("score-input")) {
      const input = e.target;
      if (input.value === "") { updateStandings(input.dataset.group); return; }
      let val = parseInt(input.value.replace(/\D/g, ""), 10);
      if (isNaN(val)) input.value = "";
      else { if (val > 20) val = 20; if (val < 0) val = 0; input.value = val; }
      updateStandings(input.dataset.group);
    }
  });

  const form = document.getElementById("quiniela-form");
  const messageBox = document.getElementById("message-box");
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (currentUser && !currentUser.is_active) {
      showMessage("❌ Estás siendo revisado, espera hasta que activen tu cuenta", "error");
      return;
    }
    
    // Check lock one last time before submitting
    try {
      const settingsRes = await apiFetch("/api/settings");
      const settings = await settingsRes.json();
      if (settings.predictions_locked === "true") {
        document.getElementById("lock-modal").style.display = "flex";
        predictionsLocked = true;
        return;
      }
    } catch (e) {}

    // NEW: Show confirmation modal instead of submitting immediately
    confirmModal.style.display = "flex";
  });

  // NEW: Logic for the confirmation button in the modal
  document.getElementById("confirm-submit-btn").onclick = async () => {
    confirmModal.style.display = "none";
    
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    const rows = document.querySelectorAll(".match-row-tr");
    const predictions = [];
    
    console.log(`[Submit] Found ${rows.length} matches to process.`);
    
    rows.forEach((row) => {
      const inputs = row.querySelectorAll(".score-input");
      if (inputs.length >= 2) {
          predictions.push({
            matchId: row.dataset.match,
            team1: inputs[0].dataset.team,
            score1: inputs[0].value.trim() === "" ? "0" : inputs[0].value,
            team2: inputs[1].dataset.team,
            score2: inputs[1].value.trim() === "" ? "0" : inputs[1].value,
          });
      }
    });

    if (predictions.length === 0) {
        console.error("[Submit] No predictions collected!");
        showMessage("❌ No se detectaron partidos para enviar. Por favor recarga la página.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar Quiniela completa";
        return;
    }

    try {
      const res = await apiFetch("/api/predict", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": userToken
        },
        body: JSON.stringify({ predictions }),
      });
      if (res.ok) {
        showMessage("✅ Quiniela enviada con éxito!", "success");
        setTimeout(() => location.reload(), 2000);
      } else {
        const errorData = await res.json();
        showMessage(`❌ ${errorData.error || "Error al enviar"}`, "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar Quiniela completa";
      }
    } catch (err) {
      console.error(err);
      showMessage("❌ Error de conexión", "error");
      submitBtn.disabled = false;
    }
  };

  function showMessage(msg, type, target = null) {
    const box = target || messageBox;
    if (!box) return;
    box.textContent = msg;
    box.className = box.id === "message-box" ? type : `msg ${type}`;
    box.style.display = "block";
    setTimeout(() => { if (box) box.style.display = "none"; }, 4000);
  }

  checkAuth();
});
