let gameRunning = false;
let dropMaker = null;
let timerInterval = null;
let animationFrame = null;

let score = 0;
let timeLeft = 30;
let lives = 5;
let basketX = 0;
let activeDrops = [];

let leftPressed = false;
let rightPressed = false;

const WIN_SCORE = 120;

const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const livesDisplay = document.getElementById("lives");
const gameContainer = document.getElementById("game-container");
const messageDisplay = document.getElementById("message");
const basket = document.getElementById("basket");

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    leftPressed = true;
    event.preventDefault();
  }

  if (event.key === "ArrowRight") {
    rightPressed = true;
    event.preventDefault();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") {
    leftPressed = false;
  }

  if (event.key === "ArrowRight") {
    rightPressed = false;
  }
});

function startGame() {
  if (gameRunning) return;

  clearAllTimers();
  clearDrops();

  gameRunning = true;
  score = 0;
  timeLeft = 30;
  lives = 5;
  activeDrops = [];
  leftPressed = false;
  rightPressed = false;

  centerBasket();
  updateDisplay();
  setMessage("Use the left and right arrow keys to move the basket.", "#159A48");

  dropMaker = setInterval(createDrop, 900);

  timerInterval = setInterval(() => {
    if (!gameRunning) return;

    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);

  gameLoop();
}

function resetGame() {
  gameRunning = false;
  clearAllTimers();
  clearDrops();

  score = 0;
  timeLeft = 30;
  lives = 5;
  activeDrops = [];
  leftPressed = false;
  rightPressed = false;

  centerBasket();
  updateDisplay();
  setMessage("Game reset. Click Start to play again.", "#2E9DF7");
}

function gameLoop() {
  if (!gameRunning) return;

  moveBasket();
  moveDrops();
  animationFrame = requestAnimationFrame(gameLoop);
}

function centerBasket() {
  basketX = (gameContainer.offsetWidth - basket.offsetWidth) / 2;
  basket.style.left = `${basketX}px`;
}

function moveBasket() {
  const speed = 8;
  const containerWidth = gameContainer.offsetWidth;
  const basketWidth = basket.offsetWidth;

  if (leftPressed) {
    basketX -= speed;
  }

  if (rightPressed) {
    basketX += speed;
  }

  if (basketX < 0) basketX = 0;
  if (basketX > containerWidth - basketWidth) {
    basketX = containerWidth - basketWidth;
  }

  basket.style.left = `${basketX}px`;
}

function createDrop() {
  if (!gameRunning) return;

  const drop = document.createElement("div");
  drop.classList.add("water-drop");

  const isBad = Math.random() < 0.25;
  if (isBad) {
    drop.classList.add("bad-drop");
  } else {
    drop.classList.add("good-drop");
  }

  const size = Math.random() * 16 + 34;
  const containerWidth = gameContainer.offsetWidth;
  const x = Math.random() * (containerWidth - size);
  const y = -size;
  const speed = Math.random() * 1.0 + 1.6;

  drop.style.width = `${size}px`;
  drop.style.height = `${size}px`;
  drop.style.left = `${x}px`;
  drop.style.top = `${y}px`;

  gameContainer.appendChild(drop);

  activeDrops.push({
    element: drop,
    x: x,
    y: y,
    size: size,
    speed: speed,
    isBad: isBad
  });
}

function moveDrops() {
  const containerHeight = gameContainer.offsetHeight;
  const basketTop = basket.offsetTop;
  const basketLeft = basket.offsetLeft;
  const basketRight = basketLeft + basket.offsetWidth;

  for (let i = activeDrops.length - 1; i >= 0; i--) {
    const drop = activeDrops[i];
    drop.y += drop.speed;
    drop.element.style.top = `${drop.y}px`;

    const dropLeft = drop.x;
    const dropRight = drop.x + drop.size;
    const dropBottom = drop.y + drop.size;

    const caughtByBasket =
      dropBottom >= basketTop &&
      dropBottom <= basketTop + 28 &&
      dropRight >= basketLeft &&
      dropLeft <= basketRight;

    if (caughtByBasket) {
      if (drop.isBad) {
        score = Math.max(0, score - 10);
        lives--;
        setMessage("Oops! Polluted water hit the basket.", "#F5402C");
        flashContainer("flash-bad");
      } else {
        score += 10;
        setMessage("Nice! You collected clean water.", "#159A48");
        flashContainer("flash-good");
      }

      updateDisplay();
      removeDrop(i);

      if (score >= WIN_SCORE) {
        endGame(true);
        return;
      }

      if (lives <= 0) {
        endGame(false, "No lives left! Game over.");
        return;
      }

      continue;
    }

    if (drop.y > containerHeight) {
      if (!drop.isBad) {
        lives--;
        setMessage("You missed a clean drop!", "#F5402C");
        updateDisplay();

        if (lives <= 0) {
          endGame(false, "No lives left! Game over.");
          return;
        }
      }

      removeDrop(i);
    }
  }
}

function removeDrop(index) {
  if (activeDrops[index] && activeDrops[index].element) {
    activeDrops[index].element.remove();
  }
  activeDrops.splice(index, 1);
}

function clearDrops() {
  const allDrops = document.querySelectorAll(".water-drop");
  allDrops.forEach((drop) => drop.remove());
  activeDrops = [];
}

function updateDisplay() {
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;

  let hearts = "";
  for (let i = 0; i < lives; i++) hearts += "❤️";
  for (let i = lives; i < 5; i++) hearts += "🩶";
  livesDisplay.textContent = hearts;
}

function setMessage(text, color) {
  messageDisplay.textContent = text;
  messageDisplay.style.color = color;
}

function flashContainer(className) {
  gameContainer.classList.remove("flash-good", "flash-bad");
  void gameContainer.offsetWidth;
  gameContainer.classList.add(className);

  setTimeout(() => {
    gameContainer.classList.remove(className);
  }, 250);
}

function endGame(isWin = false, customMessage = "") {
  gameRunning = false;
  clearAllTimers();
  clearDrops();

  if (isWin) {
    score = WIN_SCORE;
    updateDisplay();
    launchConfetti();
    setMessage(`You win! Final score: ${WIN_SCORE}.`, "#159A48");
    return;
  }

  if (customMessage) {
    setMessage(`${customMessage} Final score: ${score}.`, "#F5402C");
    return;
  }

  setMessage(`Time's up! Final score: ${score}. Try again!`, "#F5402C");
}

function launchConfetti() {
  if (typeof confetti !== "function") return;

  confetti({
    particleCount: 120,
    spread: 70,
    origin: { y: 0.6 }
  });

  setTimeout(() => {
    confetti({
      particleCount: 80,
      spread: 100,
      origin: { y: 0.5 }
    });
  }, 250);
}

function clearAllTimers() {
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  cancelAnimationFrame(animationFrame);
}

updateDisplay();
centerBasket();
setMessage("Press Start, then use the left and right arrow keys.", "#2E9DF7");