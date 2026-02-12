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