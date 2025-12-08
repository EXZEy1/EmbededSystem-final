
const PROJECT_ID = "smart-plant-care-system-179aa"; 

// URL สำหรับดึงข้อมูล (REST API)
const API_URL = `https://smart-plant-care-system-179aa-default-rtdb.asia-southeast1.firebasedatabase.app/Sensor.json`;

// ตั้งค่าเกณฑ์แจ้งเตือน (Thresholds)
const SOIL_DRY_THRESHOLD = 2500; 
const LIGHT_OK_THRESHOLD = 1000; 

const REFRESH_MS = 5000; // อัปเดตทุก 5 วินาที 


const refreshBtn = document.getElementById("refreshBtn");
const connDot = document.getElementById("connDot");
const connText = document.getElementById("connText");
const updatedEl = document.getElementById("updated");

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

// ฟังก์ชันอัปเดตการ์ด
function updateCard(id, valueText, statusText) {
  const card = document.getElementById(id);
  if(card) {
    const valEl = card.querySelector(".value");
    const statEl = card.querySelector(".status");
    valEl.innerText = valueText;
    statEl.innerText = statusText;
  }
}

// ฟังก์ชันแสดงตอนไม่มีข้อมูล
function showNoData(message = "Offline"){
  updateCard("soil", "--", message);
  updateCard("light", "--", message);
  updateCard("temp", "--", message);
  updateCard("humi", "--", message);
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

    // --- ดึงค่าจาก JSON (ตามชื่อที่ตั้งใน ESP32) ---
    
    const soil = data.Soil;
    const light = data.Light;
    const temp = data.Temp;
    const humi = data.Humid;

    // --- วิเคราะห์สถานะ (Logic) ---
    
    // 1. ดิน (Soil)
    let soilStatus = "รอข้อมูล";
    if (soil !== undefined) {
      
      soilStatus = soil > SOIL_DRY_THRESHOLD ? "💧 ดินแห้ง (ปั๊มทำงาน)" : "🌱 ดินชุ่มชื้น";
    }

    // 2. แสง (Light - LDR)
    let lightStatus = "รอข้อมูล";
    if (light !== undefined) {
       lightStatus = light > LIGHT_OK_THRESHOLD ? "🌤 แสงพอ" : "🌑 แสงน้อย";
    }

    // 3. อุณหภูมิ (Temp)
    let tempStatus = "รอข้อมูล";
    if (temp !== undefined) {
      tempStatus = temp > 32 ? "🥵 ร้อน" : (temp < 20 ? "🥶 เย็น" : "🌡 ปกติ");
    }

    // 4. ความชื้นอากาศ (Humid)
    let humiStatus = "รอข้อมูล";
    if (humi !== undefined) {
      humiStatus = humi < 40 ? "💨 แห้งไป" : (humi > 80 ? "💦 ชื้นไป" : "👌 ปกติ");
    }

    // --- อัปเดตหน้าจอ ---
    updateCard("soil", soil ?? "--", soilStatus);
    updateCard("light", light ?? "--", lightStatus);
    updateCard("temp", (temp ?? "--") + " °C", tempStatus);
    updateCard("humi", (humi ?? "--") + " %", humiStatus);

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