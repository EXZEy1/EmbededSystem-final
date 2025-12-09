const PROJECT_ID = "smart-plant-care-system-179aa"; 
const API_URL = `https://smart-plant-care-system-179aa-default-rtdb.asia-southeast1.firebasedatabase.app/Sensor.json`;

// เกณฑ์แจ้งเตือน
const SOIL_DRY_THRESHOLD = 2500; 
const LIGHT_OK_THRESHOLD = 1000; 
const REFRESH_MS = 5000;

// Elements
const refreshBtn = document.getElementById("refreshBtn");
const connDot = document.getElementById("connDot");
const connText = document.getElementById("connText");
const updatedEl = document.getElementById("updated");

// ปุ่มควบคุมใหม่
const btnOn = document.getElementById("btnOn");
const btnOff = document.getElementById("btnOff");
const btnAuto = document.getElementById("btnAuto");
const controlStatus = document.getElementById("controlStatus");

// --- จัดการปุ่มกด (ตัวอย่าง: แค่แสดงสถานะหน้าเว็บ) ---
// *ถ้าต้องการให้ส่งค่ากลับไป Firebase ต้องเขียน PUT method เพิ่มตรงนี้*
btnOn.addEventListener("click", () => {
    console.log("Command: ON");
    controlStatus.innerText = "สถานะปัจจุบัน: 🟢 เปิดทำงาน";
    // ใส่โค้ดส่งค่าไป Firebase ตรงนี้ได้
});

btnOff.addEventListener("click", () => {
    console.log("Command: OFF");
    controlStatus.innerText = "สถานะปัจจุบัน: 🔴 ปิดการทำงาน";
});

btnAuto.addEventListener("click", () => {
    console.log("Command: AUTO");
    controlStatus.innerText = "สถานะปัจจุบัน: 🔵 โหมด Auto";
});


// ฟังก์ชันเปลี่ยนสีสถานะ
function setBadge(state){
  if(state === "ok"){
    connDot.style.backgroundColor = "#22c55e"; 
    connText.textContent = "Online";
    connText.style.color = "#15803d";
  } else if(state === "err"){
    connDot.style.backgroundColor = "#ef4444"; 
    connText.textContent = "Error";
    connText.style.color = "#b91c1c";
  } else {
    connDot.style.backgroundColor = "#fbbf24"; 
    connText.textContent = "Loading...";
    connText.style.color = "#b45309";
  }
}

function updateCard(id, valueText, statusText) {
  const card = document.getElementById(id);
  if(card) {
    const valEl = card.querySelector(".value");
    const statEl = card.querySelector(".status");
    valEl.innerText = valueText;
    statEl.innerText = statusText;
  }
}

function showNoData(message = "Offline"){
  updateCard("soil", "--", message);
  updateCard("light", "--", message);
  updatedEl.innerText = "อัปเดตล่าสุด: --";
}

async function fetchData() {
  if(!PROJECT_ID || PROJECT_ID === "ใส่ชื่อโปรเจคของคุณตรงนี้"){
    setBadge("err");
    alert("อย่าลืมแก้ชื่อ PROJECT_ID ในไฟล์ app.js นะครับ!");
    return;
  }

  setBadge("loading");
  refreshBtn.disabled = true;
  refreshBtn.innerText = "⏳...";

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Network response was not ok");
    
    const data = await res.json(); 
    if(!data){
      setBadge("err");
      showNoData("No Data");
      return;
    }

    // --- ดึงค่า (เหลือแค่ Soil กับ Light) ---
    const soil = data.Soil;
    const light = data.Light;

    // 1. ดิน (Soil)
    let soilStatus = "รอข้อมูล";
    if (soil !== undefined) {
      soilStatus = soil > SOIL_DRY_THRESHOLD ? "💧 ดินแห้ง (ปั๊มทำงาน)" : "🌱 ดินชุ่มชื้น";
    }

    // 2. แสง (Light)
    let lightStatus = "รอข้อมูล";
    if (light !== undefined) {
       lightStatus = light > LIGHT_OK_THRESHOLD ? "🌤 แสงพอ" : "🌑 แสงน้อย";
    }

    // --- อัปเดตหน้าจอ ---
    updateCard("soil", soil ?? "--", soilStatus);
    updateCard("light", light ?? "--", lightStatus);

    // เวลาปัจจุบัน
    const now = new Date();
    updatedEl.innerText = "อัปเดตล่าสุด: " + now.toLocaleTimeString("th-TH");

    setBadge("ok");

  } catch (err) {
    console.error("Error fetching data:", err);
    setBadge("err");
  } finally {
    refreshBtn.disabled = false;
    refreshBtn.innerText = "🔄 Refresh";
  }
}

refreshBtn.addEventListener("click", fetchData);

fetchData();
setInterval(fetchData, REFRESH_MS);