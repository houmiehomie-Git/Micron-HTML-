const TICKER = "MU";
const DAYS_FOR_MA = 50;

let allData = [];
let currentRange = "1Y";

async function loadData() {
  const url = "https://query1.finance.yahoo.com/v7/finance/download/MU?period1=631152000&period2=1893456000&interval=1d&events=history&includeAdjustedClose=true";
  const response = await fetch(url);
  const text = await response.text();
  const rows = text.trim().split("
").slice(1);

  allData = rows.map(row => {
    const [date, open, high, low, close, adjClose, volume] = row.split(",");
    return {
      date: new Date(date),
      close: Number(close)
    };
  }).filter(x => !isNaN(x.close));

  render();
}

function movingAverage(data, period) {
  return data.map((item, index) => {
    if (index < period - 1) return null;
    const slice = data.slice(index - period + 1, index + 1);
    const avg = slice.reduce((sum, x) => sum + x.close, 0) / period;
    return avg;
  });
}

function filterRange(data, range) {
  const lastDate = data[data.length - 1].date;
  let startDate = new Date(lastDate);

  if (range === "1M") startDate.setMonth(startDate.getMonth() - 1);
  else if (range === "6M") startDate.setMonth(startDate.getMonth() - 6);
  else if (range === "1Y") startDate.setFullYear(startDate.getFullYear() - 1);
  else if (range === "5Y") startDate.setFullYear(startDate.getFullYear() - 5);
  else if (range === "MAX") startDate = new Date(0);

  return data.filter(x => x.date >= startDate);
}

function getSignal(data) {
  if (data.length < 200) return "Málo dat pro silný signál.";

  const closes = data.map(x => x.close);
  const ma50 = closes.slice(-50).reduce((a, b) => a + b, 0) / 50;
  const ma200 = closes.slice(-200).reduce((a, b) => a + b, 0) / 200;
  const last = closes[closes.length - 1];

  if (last > ma50 && ma50 > ma200) return "Signál: SPÍŠE KOUPIT";
  if (last < ma50 && ma50 < ma200) return "Signál: SPÍŠE PRODAT";
  return "Signál: DRŽET";
}

function render() {
  const data = filterRange(allData, currentRange);
  const dates = data.map(x => x.date);
  const closes = data.map(x => x.close);
  const ma50 = movingAverage(data, DAYS_FOR_MA);

  const last = closes[closes.length - 1];
  document.getElementById("status").textContent =
    `Ticker: ${TICKER} | Poslední cena: ${last.toFixed(2)} USD | Období: ${currentRange}`;

  document.getElementById("signal").textContent = getSignal(allData);

  const trace1 = {
    x: dates,
    y: closes,
    type: "scatter",
    mode: "lines",
    name: "Cena",
    line: { color: "#2563eb", width: 2 }
  };

  const trace2 = {
    x: dates,
    y: ma50,
    type: "scatter",
    mode: "lines",
    name: "50denní MA",
    line: { color: "#f59e0b", width: 2 }
  };

  const layout = {
    title: "Micron (MU) – cena a klouzavý průměr",
    margin: { t: 50, l: 50, r: 20, b: 50 },
    xaxis: { title: "Datum" },
    yaxis: { title: "Cena v USD" }
  };

  Plotly.newPlot("chart", [trace1, trace2], layout, { responsive: true });
}

function setRange(range) {
  currentRange = range;
  render();
}

window.setRange = setRange;
loadData();