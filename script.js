const clickButton = document.getElementById("clickButton");
const buttonWrapper = document.querySelector(".button-wrapper");
const counter = document.getElementById("counter");
const titleEl = document.getElementById("title");
const personalContributionEl = document.getElementById("personalContribution");
const nicknameInput = document.getElementById("nicknameInput");
const onlineIndicator = document.getElementById("onlineIndicator");
const leaderboardList = document.getElementById("leaderboardList");

const CONTRIBUTION_KEY = "personalClickCount";
const NICKNAME_KEY = "nickname";
const CLIENT_ID_KEY = "clientId";

nicknameInput.value = localStorage.getItem(NICKNAME_KEY) || "";
nicknameInput.addEventListener("change", () => {
  localStorage.setItem(NICKNAME_KEY, nicknameInput.value.trim());
});

function getNickname() {
  return nicknameInput.value.trim() || "Игрок";
}

let clientId = localStorage.getItem(CLIENT_ID_KEY);
if (!clientId) {
  clientId = crypto.randomUUID();
  localStorage.setItem(CLIENT_ID_KEY, clientId);
}

function getPersonalCount() {
  return Number(localStorage.getItem(CONTRIBUTION_KEY)) || 0;
}

function bumpPersonalCount() {
  const newCount = getPersonalCount() + 1;
  localStorage.setItem(CONTRIBUTION_KEY, newCount);
  personalContributionEl.textContent = `Ваш вклад: ${newCount} кликов`;
}

function spawnPlusOne(clickEvent) {
  const plusOne = document.createElement("span");
  plusOne.className = "plus-one";
  plusOne.textContent = "+1";

  const wrapperRect = buttonWrapper.getBoundingClientRect();
  plusOne.style.left = `${clickEvent.clientX - wrapperRect.left}px`;
  plusOne.style.top = `${clickEvent.clientY - wrapperRect.top}px`;

  buttonWrapper.appendChild(plusOne);
  plusOne.addEventListener("animationend", () => plusOne.remove());
}

function updateButtonLevel(count) {
  clickButton.classList.remove("level-neon", "level-gold");

  if (count >= 100) {
    clickButton.classList.add("level-gold");
  } else if (count >= 50) {
    clickButton.classList.add("level-neon");
  }
}

function renderLeaderboard(leaderboard = []) {
  leaderboardList.innerHTML = "";
  leaderboard.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.nickname} — ${entry.clicks} кликов`;
    leaderboardList.appendChild(li);
  });
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
  if (audioCtx.state === "suspended") audioCtx.resume();

  const oscillator = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

  oscillator.connect(gain);
  gain.connect(audioCtx.destination);

  oscillator.start();
  oscillator.stop(audioCtx.currentTime + 0.15);
}

async function loadCurrentCount() {
  try {
    const response = await fetch("/api/registerClick");
    const data = await response.json();
    counter.textContent = data.count;
    updateButtonLevel(data.count);
    renderLeaderboard(data.leaderboard);
  } catch (error) {
    console.error("Ошибка при загрузке счётчика:", error);
  }
}

async function pingOnline() {
  try {
    const response = await fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId }),
    });
    const data = await response.json();
    onlineIndicator.textContent = `🟢 Онлайн: ${data.online} чел.`;
  } catch (error) {
    console.error("Ошибка при обновлении онлайна:", error);
  }
}

personalContributionEl.textContent = `Ваш вклад: ${getPersonalCount()} кликов`;
loadCurrentCount();
pingOnline();
setInterval(loadCurrentCount, 2000);
setInterval(pingOnline, 7000);

clickButton.addEventListener("click", async (clickEvent) => {
  clickButton.disabled = true;
  spawnPlusOne(clickEvent);
  playClickSound();
  bumpPersonalCount();

  try {
    const response = await fetch("/api/registerClick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname: getNickname() }),
    });

    const data = await response.json();

    counter.textContent = data.count;
    updateButtonLevel(data.count);
    renderLeaderboard(data.leaderboard);

    if (data.title) {
      titleEl.textContent = "🎉 " + data.title + " 🎉";
      titleEl.classList.add("show");
    } else {
      titleEl.classList.remove("show");
    }
  } catch (error) {
    console.error("Ошибка при отправке клика:", error);
  } finally {
    clickButton.disabled = false;
  }
});
