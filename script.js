const clickButton = document.getElementById("clickButton");
const buttonWrapper = document.querySelector(".button-wrapper");
const counter = document.getElementById("counter");
const titleEl = document.getElementById("title");
const personalContributionEl = document.getElementById("personalContribution");

const CONTRIBUTION_KEY = "personalClickCount";

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

async function loadCurrentCount() {
  try {
    const response = await fetch("/api/registerClick");
    const data = await response.json();
    counter.textContent = data.count;
    updateButtonLevel(data.count);
  } catch (error) {
    console.error("Ошибка при загрузке счётчика:", error);
  }
}

personalContributionEl.textContent = `Ваш вклад: ${getPersonalCount()} кликов`;
loadCurrentCount();
setInterval(loadCurrentCount, 2000);

clickButton.addEventListener("click", async (clickEvent) => {
  clickButton.disabled = true;
  spawnPlusOne(clickEvent);
  bumpPersonalCount();

  try {
    const response = await fetch("/api/registerClick", {
      method: "POST",
    });

    const data = await response.json();

    counter.textContent = data.count;
    updateButtonLevel(data.count);

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
