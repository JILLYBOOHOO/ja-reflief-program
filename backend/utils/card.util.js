function generateCardNumber() {
  return Math.floor(1000000000000000 + Math.random() * 9000000000000000)
    .toString();
}

function generateCVV() {
  return Math.floor(100 + Math.random() * 900).toString();
}

function generatePIN() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getInitialBalance(damageLevel) {
  switch (damageLevel) {
    case 'Minor':
      return 25000;
    case 'Moderate':
      return 50000;
    case 'Severe':
      return 100000;
    default:
      return 0;
  }
}

module.exports = { generateCardNumber, generateCVV, generatePIN, getInitialBalance };
