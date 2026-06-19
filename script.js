const clickButton = document.getElementById("clickButton");
const buttonWrapper = document.querySelector(".button-wrapper");
const counter = document.getElementById("counter");
const titleEl = document.getElementById("title");
const personalContributionEl = document.getElementById("personalContribution");
const nicknameInput = document.getElementById("nicknameInput");
const nicknameError = document.getElementById("nicknameError");
const onlineIndicator = document.getElementById("onlineIndicator");
const leaderboardList = document.getElementById("leaderboardList");

const CONTRIBUTION_KEY = "personalClickCount";
const NICKNAME_KEY = "nickname";
const USER_ID_KEY = "userId";

const TARGET_SCORE = 300; // ВРЕМЕННО для теста финала! Боевое значение: 1000000000000000000 (квинтиллион)

const UPGRADES = [
  { id: 1, name: "Автокликер I", cost: 50, cps: 1 },
  { id: 2, name: "Автокликер II", cost: 3000, cps: 10 },
  { id: 3, name: "Автокликер III", cost: 100000, cps: 100 },
];

let gameOver = false;
let pendingAutoClicks = 0;

let userId = localStorage.getItem(USER_ID_KEY);
if (!userId) {
  userId = crypto.randomUUID();
  localStorage.setItem(USER_ID_KEY, userId);
}

nicknameInput.value = localStorage.getItem(NICKNAME_KEY) || "";

async function saveNickname() {
  const newNickname = nicknameInput.value.trim();
  if (!newNickname || newNickname === localStorage.getItem(NICKNAME_KEY)) return;

  try {
    const response = await fetch("/api/setNickname", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, nickname: newNickname }),
    });
    const data = await response.json();

    if (data.occupied) {
      nicknameError.textContent = "Этот ник уже занят другим игроком!";
      nicknameInput.value = localStorage.getItem(NICKNAME_KEY) || "";
      return;
    }

    nicknameError.textContent = "";
    localStorage.setItem(NICKNAME_KEY, newNickname);
  } catch (error) {
    console.error("Ошибка при сохранении ника:", error);
  }
}

nicknameInput.addEventListener("change", saveNickname);

function getPersonalCount() {
  return Number(localStorage.getItem(CONTRIBUTION_KEY)) || 0;
}

function setPersonalCount(newCount) {
  localStorage.setItem(CONTRIBUTION_KEY, newCount);
  personalContributionEl.textContent = `Ваш вклад: ${newCount} кликов`;
}

function bumpPersonalCount(amount = 1) {
  setPersonalCount(getPersonalCount() + amount);
}

function getUpgradeOwned(upgradeId) {
  return Number(localStorage.getItem(`upgrade${upgradeId}Count`)) || 0;
}

function setUpgradeOwned(upgradeId, count) {
  localStorage.setItem(`upgrade${upgradeId}Count`, count);
}

function getTotalCps() {
  return UPGRADES.reduce((sum, upgrade) => sum + upgrade.cps * getUpgradeOwned(upgrade.id), 0);
}

function renderShop() {
  UPGRADES.forEach((upgrade) => {
    const owned = getUpgradeOwned(upgrade.id);
    document.getElementById(`owned-${upgrade.id}`).textContent = `У вас: ${owned}`;

    const buyButton = document.getElementById(`buy-${upgrade.id}`);
    buyButton.disabled = gameOver || getPersonalCount() < upgrade.cost;
  });
}

function buyUpgrade(upgradeId) {
  const upgrade = UPGRADES.find((item) => item.id === upgradeId);
  if (!upgrade || getPersonalCount() < upgrade.cost) return;

  setPersonalCount(getPersonalCount() - upgrade.cost);
  setUpgradeOwned(upgradeId, getUpgradeOwned(upgradeId) + 1);
  renderShop();
}

UPGRADES.forEach((upgrade) => {
  document.getElementById(`buy-${upgrade.id}`).addEventListener("click", () => buyUpgrade(upgrade.id));
});

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

function spawnConfetti() {
  const overlay = document.getElementById("gameOverOverlay");
  const colors = ["#ffd700", "#ff6b6b", "#4cc9f0", "#06d6a0", "#f94144"];

  for (let i = 0; i < 150; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${2 + Math.random() * 3}s`;
    piece.style.animationDelay = `${Math.random() * 2}s`;
    overlay.appendChild(piece);
  }
}

function checkGameOver(count) {
  if (gameOver || count < TARGET_SCORE) return;

  gameOver = true;
  clickButton.disabled = true;
  titleEl.textContent = "";
  document.getElementById("gameOverOverlay").classList.add("show");
  spawnConfetti();
  renderShop();
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
    checkGameOver(data.count);
  } catch (error) {
    console.error("Ошибка при загрузке счётчика:", error);
  }
}

async function sendAutoClicks() {
  if (gameOver) return;

  const cps = getTotalCps();
  if (cps <= 0) return;

  pendingAutoClicks += cps;
  bumpPersonalCount(cps);
  renderShop();

  const amount = pendingAutoClicks;
  pendingAutoClicks = 0;

  try {
    const response = await fetch("/api/registerClick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount }),
    });
    const data = await response.json();

    counter.textContent = data.count;
    updateButtonLevel(data.count);
    renderLeaderboard(data.leaderboard);
    checkGameOver(data.count);
  } catch (error) {
    console.error("Ошибка при отправке автокликов:", error);
    pendingAutoClicks += amount;
  }
}

async function pingOnline() {
  try {
    const response = await fetch("/api/ping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: userId }),
    });
    const data = await response.json();
    onlineIndicator.textContent = `🟢 Онлайн: ${data.online} чел.`;
  } catch (error) {
    console.error("Ошибка при обновлении онлайна:", error);
  }
}

personalContributionEl.textContent = `Ваш вклад: ${getPersonalCount()} кликов`;
renderShop();
loadCurrentCount();
pingOnline();
setInterval(loadCurrentCount, 2000);
setInterval(pingOnline, 7000);
setInterval(sendAutoClicks, 1000);

// ВРЕМЕННЫЙ ЧИТ ДЛЯ ТЕСТА ФИНАЛА: пробел = +50 кликов. Удалить перед боевым релизом!
document.addEventListener("keydown", async (keyEvent) => {
  if (keyEvent.code !== "Space" || gameOver) return;
  keyEvent.preventDefault();

  try {
    const response = await fetch("/api/registerClick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, amount: 50 }),
    });
    const data = await response.json();

    counter.textContent = data.count;
    updateButtonLevel(data.count);
    renderLeaderboard(data.leaderboard);
    checkGameOver(data.count);
  } catch (error) {
    console.error("Ошибка чит-кода:", error);
  }
});

clickButton.addEventListener("click", async (clickEvent) => {
  if (gameOver) return;

  clickButton.disabled = true;
  spawnPlusOne(clickEvent);
  playClickSound();
  bumpPersonalCount();
  renderShop();
  await saveNickname();

  try {
    const response = await fetch("/api/registerClick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    counter.textContent = data.count;
    updateButtonLevel(data.count);
    renderLeaderboard(data.leaderboard);
    checkGameOver(data.count);

    if (data.title) {
      titleEl.textContent = "🎉 " + data.title + " 🎉";
      titleEl.classList.add("show");
    } else {
      titleEl.classList.remove("show");
    }
  } catch (error) {
    console.error("Ошибка при отправке клика:", error);
  } finally {
    clickButton.disabled = gameOver;
  }
});
