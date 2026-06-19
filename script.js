const clickButton = document.getElementById("clickButton");
const counter = document.getElementById("counter");
const titleEl = document.getElementById("title");

async function loadCurrentCount() {
  try {
    const response = await fetch("/api/registerClick");
    const data = await response.json();
    counter.textContent = data.count;
  } catch (error) {
    console.error("Ошибка при загрузке счётчика:", error);
  }
}

loadCurrentCount();

clickButton.addEventListener("click", async () => {
  clickButton.disabled = true;

  try {
    const response = await fetch("/api/registerClick", {
      method: "POST",
    });

    const data = await response.json();

    counter.textContent = data.count;

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
