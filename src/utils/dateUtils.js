// src/utils/dateUtils.js
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysDifference(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1 - date2) / oneDay));
}

export function isOverdue(dueDate) {
  return new Date(dueDate) < new Date();
}

export function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  if (month >= 3) { // April to March
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

export function getQuarter(date = new Date()) {
  const month = date.getMonth();
  const financialMonth = month >= 3 ? month - 3 : month + 9;
  return Math.floor(financialMonth / 3) + 1;
}
