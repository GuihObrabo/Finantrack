let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let chart, evolutionChart;
let lastAlert = "";

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("totalIncome");
const expenseEl = document.getElementById("totalExpense");
const listEl = document.getElementById("transactionList");

function save() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function format(value) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function updateDashboard() {
  const income = transactions.filter(t => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const expense = transactions.filter(t => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expense;

  incomeEl.innerText = format(income);
  expenseEl.innerText = format(expense);
  balanceEl.innerText = format(balance);

  updateExpenseChart();
  updateEvolutionChart();
  calculateScore(income, expense);
  smartFinancialAlert(income, expense);
  updateGoal(balance);
  projection(income, expense);
}

function addTransaction(type) {
  const desc = description.value.trim();
  const amount = Number(amountInput.value || document.getElementById("amount").value);

  if (!desc || amount <= 0) return;

  transactions.push({
    id: Date.now(),
    desc,
    amount,
    type,
    date: new Date().toLocaleDateString()
  });

  save();
  render();
  description.value = "";
  document.getElementById("amount").value = "";
}

function render() {
  listEl.innerHTML = "";
  transactions.forEach(t => {
    listEl.innerHTML += `
      <li>
        <span>${t.desc}</span>
        <span>${t.type === "income" ? "+" : "-"} ${format(t.amount)}</span>
      </li>
    `;
  });
  updateDashboard();
}

/* GRÁFICO DE DESPESAS POR DESCRIÇÃO */
function updateExpenseChart() {
  if (chart) chart.destroy();

  const expenseMap = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    expenseMap[t.desc] = (expenseMap[t.desc] || 0) + t.amount;
  });

  const labels = Object.keys(expenseMap);
  const values = Object.values(expenseMap);

  if (labels.length === 0) {
    labels.push("Sem despesas");
    values.push(1);
  }

  chart = new Chart(financeChart, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: [
          "#e53935",
          "#fb8c00",
          "#fdd835",
          "#43a047",
          "#1e88e5",
          "#8e24aa"
        ]
      }]
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#fff" }
        },
        tooltip: {
          callbacks: {
            label: context => {
              const total = values.reduce((a, b) => a + b, 0);
              const percent = ((context.raw / total) * 100).toFixed(1);
              return `${context.label}: ${format(context.raw)} (${percent}%)`;
            }
          }
        }
      }
    }
  });
}

/* GRÁFICO DE EVOLUÇÃO */
function updateEvolutionChart() {
  if (evolutionChart) evolutionChart.destroy();

  let saldo = 0;
  const labels = [];
  const values = [];

  transactions.forEach(t => {
    saldo += t.type === "income" ? t.amount : -t.amount;
    labels.push(t.date);
    values.push(saldo);
  });

  evolutionChart = new Chart(evolutionChartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: "#4caf50",
        tension: 0.3
      }]
    }
  });
}

function calculateScore(income, expense) {
  if (!income) {
    financeScore.innerText = 0;
    return;
  }
  financeScore.innerText = Math.max(0, 100 - Math.round((expense / income) * 100));
}

function smartFinancialAlert(income, expense) {
  if (!income) return;

  const ratio = expense / income;
  let type = ratio > 0.7 ? "danger" : ratio > 0.4 ? "warning" : "";

  if (type === lastAlert) return;
  lastAlert = type;

  const alertBox = document.getElementById("smartAlert");
  alertBox.className = `smart-alert ${type}`;
  alertBox.innerText =
    type === "danger" ? "🚨 Alerta! Gastos muito altos." :
    type === "warning" ? "⚠️ Atenção: despesas elevadas." :
    "✅ Controle financeiro saudável.";

  alertBox.classList.remove("hidden");
  setTimeout(() => alertBox.classList.add("hidden"), 5000);
}

function projection(income, expense) {
  const avg = (income - expense) / Math.max(transactions.length, 1);
  projectionText.innerText = format(avg * 30);
}

goalValue.onchange = e => localStorage.setItem("goal", e.target.value);

function updateGoal(balance) {
  const goal = Number(localStorage.getItem("goal"));
  if (!goal) return;

  const percent = Math.min((balance / goal) * 100, 100);
  goalProgress.style.width = percent + "%";
  goalStatus.innerText = `${format(balance)} / ${format(goal)}`;
}

function generateSpreadsheet() {
  loader.classList.remove("hidden");
  setTimeout(() => {
    let csv = "Descrição,Tipo,Valor\n";
    transactions.forEach(t => {
      csv += `${t.desc},${t.type === "income" ? "Entrada" : "Despesa"},${t.amount}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "finantrack-pro.csv";
    link.click();
    loader.classList.add("hidden");
  }, 800);
}

function loadDemoData() {
  transactions = [
    { id: 1, desc: "Salário", amount: 5000, type: "income", date: "01/01" },
    { id: 2, desc: "Aluguel", amount: 1500, type: "expense", date: "02/01" },
    { id: 3, desc: "Internet", amount: 120, type: "expense", date: "03/01" },
    { id: 4, desc: "Mercado", amount: 650, type: "expense", date: "05/01" }
  ];
  save();
  render();
}

render();
