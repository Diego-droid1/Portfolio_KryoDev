// coins.js
const DEVCOINS_KEY = 'userCoins';

// Devuelve las monedas del usuario (global)
function getDevCoins() {
  return parseInt(localStorage.getItem(DEVCOINS_KEY) || '0', 10);
}

// Establece una nueva cantidad
function setDevCoins(amount) {
  localStorage.setItem(DEVCOINS_KEY, Math.max(0, parseInt(amount, 10)));
}

// Suma monedas
function addDevCoins(amount) {
  setDevCoins(getDevCoins() + parseInt(amount, 10));
}

// Resta monedas si hay suficientes
function subtractDevCoins(amount) {
  const current = getDevCoins();
  if (amount > current) return false;
  setDevCoins(current - amount);
  return true;
}