// Add JS here

document.getElementById('generate-button').addEventListener('click', generateLotteryNumbers);

function generateLotteryNumbers() {
  const numbers = new Set();
  while (numbers.size < 6) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);
  const lotteryNumbersDiv = document.getElementById('lottery-numbers');
  lotteryNumbersDiv.innerHTML = ''; // Clear previous numbers

  sortedNumbers.forEach(number => {
    const numberSpan = document.createElement('span');
    numberSpan.textContent = number;
    numberSpan.classList.add('lottery-number');
    lotteryNumbersDiv.appendChild(numberSpan);
  });
}

// Theme toggle logic
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

function applyTheme(theme) {
  body.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '화이트 모드' : '다크 모드';
}

// Load saved theme or default to light
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  applyTheme(savedTheme);
} else {
  applyTheme('light'); // Default theme
}

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  localStorage.setItem('theme', newTheme);
});