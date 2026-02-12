// Add JS here

document.getElementById('generate-button').addEventListener('click', generateLotteryNumbers);

let hasGeneratedFirstTime = false; // Flag to track if numbers have been generated for the first time
let latestFetchedDrwNo = 0; // Store the latest fetched drawing number to avoid re-fetching

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
    console.log(`Fetching lotto numbers for drwNo: ${drwNo}`);
    const response = await fetch(`${HISTORICAL_API_URL}${drwNo}`);
    const data = await response.json();
    console.log(`Response for drwNo ${drwNo}:`, data);
    if (data.returnValue === 'success') {
      return data;
    }
    return null; // Return null if API indicates failure or data is not success
  } catch (error) {
    console.error(`Error fetching lotto numbers for drwNo ${drwNo}:`, error);
    return null; // Return null on network or parsing error
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

// Function to find the latest available drawing number
async function findLatestDrwNo() {
  // Start from a high number that is likely in the future
  let currentDrwNo = 1200; // Starting point, adjust as needed

  // Try to find the latest valid drwNo by incrementing until failure then decrementing
  // A robust approach to find the latest draw number.
  // First, find a drwNo that is likely in the future.
  // Then, decrement to find the latest valid one.
  // This avoids hammering the API with decrements from a fixed 'high' which might be too low.

  // Step 1: Find a drwNo that is likely in the future or the current one.
  // We can assume draws happen weekly. With today's date (Feb 12, 2026),
  // we can calculate an approximate draw number.
  // Lotto started on Dec 7, 2002 (drwNo 1).
  const startDate = new Date('2002-12-07');
  const now = new Date();
  const weeksDiff = Math.floor((now - startDate) / (1000 * 60 * 60 * 24 * 7));
  let approximateDrwNo = weeksDiff + 1;

  console.log(`Approximate drwNo: ${approximateDrwNo}`);

  // Step 2: Search upwards from approximate DrwNo to find a "fail"
  // This will indicate we've gone past the latest successful draw.
  let searchDrwNo = approximateDrwNo;
  let foundFutureDraw = false;
  let maxSearchAttempts = 50; // Safety break
  while (!foundFutureDraw && maxSearchAttempts > 0) {
    const data = await fetchLottoNumbers(searchDrwNo);
    if (!data || data.returnValue === 'fail') {
      foundFutureDraw = true;
      console.log(`Found future draw at drwNo: ${searchDrwNo}`);
      break;
    }
    searchDrwNo++;
    maxSearchAttempts--;
  }

  if (!foundFutureDraw) {
    console.error("Could not determine future draw within reasonable attempts. Defaulting to a safe known draw.");
    return 1000; // Default to a safe known draw if search fails
  }

  // Step 3: Decrement from the found future draw to get the latest successful one.
  let latestSuccessfulDrwNo = searchDrwNo - 1;
  while (latestSuccessfulDrwNo > 0 && !(await fetchLottoNumbers(latestSuccessfulDrwNo))) {
    latestSuccessfulDrwNo--;
    if (searchDrwNo - latestSuccessfulDrwNo > 10) { // Safety break
      console.error("Could not find latest successful draw by decrementing. Defaulting to a safe known draw.");
      return 1000; // Default to a safe known draw if search fails
    }
  }

  return latestSuccessfulDrwNo > 0 ? latestSuccessfulDrwNo : 1000; // Ensure it's not 0
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
    }
  }
  console.log("Finished fetching and displaying historical numbers.");
}

// Removed: Call to fetch and display historical numbers on page load
// fetchAndDisplayHistoricalNumbers();