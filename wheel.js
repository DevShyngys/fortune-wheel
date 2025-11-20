// ===== CONFIG =====
const prizes = [
  { label: "Скидка 10%", color: "#00b4ff", probability: 40 },
  { label: "Подарок №1", color: "#0564b0", probability: 25 },
  { label: "Подарок №2", color: "#003a70", probability: 20 },
  { label: "Скидка 5%", color: "#00ff7f", probability: 10 },
  { label: "Главный приз", color: "#ffcc00", probability: 5 }
];

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxq7B0v1DFi1MKCXrv5T7adVzsssbpulqxo9oq_rjPlZF0DutRiKkLnTEuXv-l1Nuc_VQ/exec";
const USER_UID = new URLSearchParams(window.location.search).get("uid") || crypto.randomUUID();

let userName = "", userPhone = "", isSpinning = false;

// ===== Canvas =====
const wheel = document.getElementById("wheelCanvas");
const ctx = wheel.getContext("2d");
const radius = wheel.width / 2;
const segmentAngle = 2 * Math.PI / prizes.length;

function drawWheel() {
  ctx.clearRect(0, 0, wheel.width, wheel.height);
  for (let i = 0; i < prizes.length; i++) {
    const start = i * segmentAngle;
    const end = start + segmentAngle;
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.fillStyle = prizes[i].color;
    ctx.arc(radius, radius, radius, start, end);
    ctx.fill();

    ctx.save();
    ctx.translate(radius, radius);
    ctx.rotate(start + segmentAngle / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = "14px Arial";
    ctx.fillText(prizes[i].label, radius - 10, 5);
    ctx.restore();
  }
}
drawWheel();

// ===== Select prize =====
function selectPrize() {
  let sum = prizes.reduce((a, p) => a + p.probability, 0);
  let r = Math.random() * sum;
  for (let p of prizes) {
    if (r < p.probability) return p.label;
    r -= p.probability;
  }
}

async function sendResult(prize){
  try{
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        uid: USER_UID,
        name: userName,
        phone: userPhone,
        prize,
        timestamp: Date.now()
      })
    });
    console.log("Данные отправлены (no-cors)");
  }catch(e){
    console.warn("Ошибка отправки", e);
  }
}



// ===== Form logic =====
document.getElementById("startBtn").onclick = () => {
  const n = document.getElementById("userName").value.trim();
  const p = document.getElementById("userPhone").value.trim();
  if (!n || !p) { alert("Введите имя и телефон"); return; }
  userName = n; userPhone = p;
  document.querySelector(".user-form").style.display = "none";
  document.querySelector(".wheel-area").style.display = "block";
}

// ===== Spin logic =====
document.getElementById("spinBtn").onclick = async () => {
  if (isSpinning) return;
  isSpinning = true;

  const prize = selectPrize();
  const prizeIndex = prizes.findIndex(p => p.label === prize);
  const anglePer = 360 / prizes.length;
  const targetAngle = 270 - (prizeIndex * anglePer + anglePer / 2);
  const rotation = 360 * 5 + targetAngle + (Math.random() - 0.5) * anglePer * 0.2;

  wheel.style.transition = "transform 5s cubic-bezier(0.33,1,0.68,1)";
  wheel.style.transform = `rotate(${rotation}deg)`;

  setTimeout(async () => {
    wheel.style.transition = "none";
    document.getElementById("result").innerHTML = `Вам выпало: <strong>${prize}</strong> 🎉`;
    await sendResult(prize);
    isSpinning = false;
    document.getElementById("spinBtn").disabled = true;
  }, 5200);
};
