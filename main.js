// Add JS here

document.getElementById('generate-button').addEventListener('click', generateLotteryNumbers);

let hasGeneratedFirstTime = false; // Flag to track if numbers have been generated for the first time

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

  // Display historical numbers only after the first generation
  if (!hasGeneratedFirstTime) {
    hasGeneratedFirstTime = true;
    fetchAndDisplayHistoricalNumbers();
    document.getElementById('historical-lottery-section').style.display = 'block'; // Make section visible
  }
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

// Historical lottery numbers logic
const HISTORICAL_API_URL = 'https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=';

async function fetchLottoNumbers(drwNo) {
  try {
    const response = await fetch(`${HISTORICAL_API_URL}${drwNo}`);
    const data = await response.json();
    if (data.returnValue === 'success') {
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching lotto numbers for drwNo ${drwNo}:`, error);
    return null;
  }
}

function displayHistoricalNumbers(data, container) {
  const drawDiv = document.createElement('div');
  drawDiv.classList.add('historical-draw');

  const drawInfo = document.createElement('p');
  drawInfo.textContent = `제${data.drwNo}회 (${data.drwNoDate})`;
  drawDiv.appendChild(drawInfo);

  const numbersDiv = document.createElement('div');
  numbersDiv.classList.add('historical-numbers');

  for (let i = 1; i <= 6; i++) {
    const numberSpan = document.createElement('span');
    numberSpan.textContent = data[`drwtNo${i}`];
    numberSpan.classList.add('lottery-number', 'historical');
    numbersDiv.appendChild(numberSpan);
  }

  const bonusSpan = document.createElement('span');
  bonusSpan.textContent = `+ ${data.bnusNo}`;
  bonusSpan.classList.add('lottery-number', 'bonus', 'historical');
  numbersDiv.appendChild(bonusSpan);

  drawDiv.appendChild(numbersDiv);
  container.appendChild(drawDiv);
}

async function fetchAndDisplayHistoricalNumbers() {
  const historicalNumbersContainer = document.getElementById('historical-numbers-container');
  if (!historicalNumbersContainer) return;

  historicalNumbersContainer.innerHTML = '로딩 중...';

  let latestDrwNo = 0;
  // Try to find the latest drawing number by checking a high number and decrementing
  // A more robust solution would involve querying a different API or using a fixed offset
  // For demonstration, we'll start high and find the last successful one.
  for (let i = 1200; i > 0; i--) { // Start from a reasonable high number
    const data = await fetchLottoNumbers(i);
    if (data && data.drwNoDate) { // Check if data is valid and has a date
      latestDrwNo = i;
      break;
    }
  }

  if (latestDrwNo === 0) {
    historicalNumbersContainer.textContent = '최신 로또 번호를 찾을 수 없습니다.';
    return;
  }

  historicalNumbersContainer.innerHTML = ''; // Clear loading text

  for (let i = 0; i < 5; i++) {
    const drwNoToFetch = latestDrwNo - i;
    const data = await fetchLottoNumbers(drwNoToFetch);
    if (data) {
      displayHistoricalNumbers(data, historicalNumbersContainer);
    }
  }
}

// Removed: Call to fetch and display historical numbers on page load
// fetchAndDisplayHistoricalNumbers();