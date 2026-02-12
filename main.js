// Add JS here

document.getElementById('generate-button').addEventListener('click', generateLotteryNumbers);

let hasGeneratedFirstTime = false; // Flag to track if numbers have been generated for the first time
let latestFetchedDrwNo = 0; // Store the latest fetched drawing number to avoid re-fetching
let generatedNumbersHistory = []; // Stores the last 5 sets of generated numbers

function displayGeneratedNumbersHistory() {
  const generatedNumbersContainer = document.getElementById('generated-numbers-container');
  if (!generatedNumbersContainer) return;

  generatedNumbersContainer.innerHTML = ''; // Clear previous history

  generatedNumbersHistory.forEach(numbers => {
    const historyEntryDiv = document.createElement('div');
    historyEntryDiv.classList.add('generated-history-entry'); // New class for styling

    numbers.forEach(number => {
      const numberSpan = document.createElement('span');
      numberSpan.textContent = number;
      numberSpan.classList.add('lottery-number', 'generated-history'); // New class for styling
      historyEntryDiv.appendChild(numberSpan);
    });
    generatedNumbersContainer.appendChild(historyEntryDiv);
  });
}

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

  // Add generated numbers to history and update display
  generatedNumbersHistory.unshift(sortedNumbers); // Add to the beginning (most recent first)
  if (generatedNumbersHistory.length > 5) {
    generatedNumbersHistory.pop(); // Keep only the last 5
  }
  displayGeneratedNumbersHistory(); // Update the display

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
const HISTORICAL_API_URL = 'https://corsproxy.io/?https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=';

async function fetchLottoNumbers(drwNo) {
  try {
    console.log(`Attempting to fetch lotto numbers for drwNo: ${drwNo}`);
    const response = await fetch(`${HISTORICAL_API_URL}${drwNo}`);
    
    if (!response.ok) {
      console.error(`Network response was not ok for drwNo ${drwNo}: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`Raw API response for drwNo ${drwNo}:`, data);
    
    if (data.returnValue === 'success') {
      return data;
    } else {
      console.warn(`API returned 'fail' or unexpected data for drwNo ${drwNo}:`, data);
      return null; 
    }
  } catch (error) {
    console.error(`Error fetching lotto numbers for drwNo ${drwNo}. This might be a CORS issue or network problem:`, error);
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

// Simplified function to find the latest available drawing number for debugging
async function findLatestDrwNo() {
  const knownGoodDrwNo = 1101; // Example of a known recent valid draw number (as of late 2023/early 2024)
  console.log(`Using fixed drwNo for debugging: ${knownGoodDrwNo}`);
  return knownGoodDrwNo;
}


async function fetchAndDisplayHistoricalNumbers() {
  const historicalNumbersContainer = document.getElementById('historical-numbers-container');
  if (!historicalNumbersContainer) return;

  if (latestFetchedDrwNo !== 0) {
      console.log("Historical numbers already fetched. Skipping re-fetch.");
      return; // Already fetched, no need to re-fetch
  }

  historicalNumbersContainer.innerHTML = '로딩 중...';
  console.log("Starting to fetch historical numbers...");

  latestFetchedDrwNo = await findLatestDrwNo(); // Update the global variable

  if (latestFetchedDrwNo === 0) {
    historicalNumbersContainer.textContent = '최신 로또 번호를 찾을 수 없습니다.';
    console.error("Failed to determine latest drawing number.");
    return;
  }

  historicalNumbersContainer.innerHTML = ''; // Clear loading text
  console.log(`Latest determined drwNo: ${latestFetchedDrwNo}`);

  for (let i = 0; i < 5; i++) {
    const drwNoToFetch = latestFetchedDrwNo - i;
    if (drwNoToFetch > 0) { // Ensure drwNo is positive
      const data = await fetchLottoNumbers(drwNoToFetch);
      if (data) {
        displayHistoricalNumbers(data, historicalNumbersContainer);
      } else {
        console.warn(`Could not fetch data for drwNo: ${drwNoToFetch}`);
      }
    } else {
      console.warn(`Skipping drwNo ${drwNoToFetch} as it's not positive.`);
    }
  }
  console.log("Finished fetching and displaying historical numbers.");
}

// Removed: Call to fetch and display historical numbers on page load
// fetchAndDisplayHistoricalNumbers();