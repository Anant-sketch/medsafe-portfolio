// MedSafe Web Simulator Logic

// --- Constants & Data Models ---
const DEFAULT_MEDICINES = [
    { id: 1, name: "Lisinopril", dosage: "10mg", timeInMinutes: 480, type: "Pill", stock: 4, isActive: true }, // 8:00 AM
    { id: 2, name: "Amoxicillin", dosage: "500mg", timeInMinutes: 840, type: "Pill", stock: 18, isActive: true }, // 2:00 PM
    { id: 3, name: "Insulin", dosage: "10 Units", timeInMinutes: 1290, type: "Injection", stock: 2, isActive: true } // 9:30 PM
];

const DEFAULT_HISTORY = [
    { id: 101, medicineId: 1, scheduledTime: Date.now() - 24 * 60 * 60 * 1000, takenTime: Date.now() - 23.9 * 60 * 60 * 1000, status: "TAKEN" },
    { id: 102, medicineId: 2, scheduledTime: Date.now() - 20 * 60 * 60 * 1000, takenTime: Date.now() - 19.8 * 60 * 60 * 1000, status: "TAKEN" },
    { id: 103, medicineId: 3, scheduledTime: Date.now() - 12 * 60 * 60 * 1000, takenTime: null, status: "MISSED" }
];

let db = {
    medicines: [],
    doseLogs: []
};

let currentPendingNotif = null; // Stores details of active notification

// --- Initialize Application ---
document.addEventListener("DOMContentLoaded", () => {
    loadDatabase();
    setupRouting();
    setupSimulatorControls();
    startPhoneClock();
    renderAll();
    
    // Add form submit handler
    document.getElementById("add-medicine-form").addEventListener("submit", handleAddMedicine);
    document.getElementById("btn-clear-history").addEventListener("click", clearHistory);
    document.getElementById("btn-close-emergency").addEventListener("click", closeEmergencyOverlay);
    
    // Setup notification action buttons
    document.getElementById("btn-notif-taken").addEventListener("click", handleNotificationTaken);
    document.getElementById("btn-notif-snooze").addEventListener("click", handleNotificationSnooze);
});

// --- Database Logic (localStorage Mock) ---
function loadDatabase() {
    try {
        const storedMeds = localStorage.getItem("medsafe_medicines");
        const storedLogs = localStorage.getItem("medsafe_logs");
        
        if (storedMeds && storedLogs) {
            db.medicines = JSON.parse(storedMeds);
            db.doseLogs = JSON.parse(storedLogs);
        } else {
            resetToDefaults();
        }
    } catch (e) {
        console.error("Local storage error, using in-memory DB", e);
        db.medicines = [...DEFAULT_MEDICINES];
        db.doseLogs = [...DEFAULT_HISTORY];
    }
}

function saveDatabase() {
    try {
        localStorage.setItem("medsafe_medicines", JSON.stringify(db.medicines));
        localStorage.setItem("medsafe_logs", JSON.stringify(db.doseLogs));
    } catch (e) {
        console.error("Failed to save database state", e);
    }
}

function resetToDefaults() {
    db.medicines = JSON.parse(JSON.stringify(DEFAULT_MEDICINES));
    db.doseLogs = JSON.parse(JSON.stringify(DEFAULT_HISTORY));
    saveDatabase();
    logConsole("Database wiped & re-seeded with default schema data.", "system");
    renderAll();
}

function clearHistory() {
    db.doseLogs = [];
    saveDatabase();
    logConsole("Dose history table truncated.", "system");
    renderAll();
}

// --- Console Log Helper ---
function logConsole(message, type = "info") {
    const consoleLogs = document.getElementById("console-logs");
    if (!consoleLogs) return;
    
    const line = document.createElement("div");
    line.className = `log-line text-${type}`;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    line.innerHTML = `[${timestamp}] <span class="log-content">${message}</span>`;
    
    consoleLogs.appendChild(line);
    consoleLogs.scrollTop = consoleLogs.scrollHeight;
    
    // Keep last 40 lines
    while (consoleLogs.children.length > 40) {
        consoleLogs.removeChild(consoleLogs.firstChild);
    }
}

// --- Screen Router ---
function setupRouting() {
    const tabs = document.querySelectorAll(".nav-tab");
    const screens = document.querySelectorAll(".app-screen");
    const screenTitle = document.getElementById("app-screen-title");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetScreen = tab.dataset.screen;
            
            // Toggle active tabs
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            // Toggle screens
            screens.forEach(screen => {
                screen.classList.remove("active");
                if (screen.id === `screen-${targetScreen}`) {
                    screen.classList.add("active");
                }
            });
            
            // Update app header text
            if (targetScreen === "home") {
                screenTitle.innerText = "Dashboard";
            } else if (targetScreen === "add") {
                screenTitle.innerText = "Add Medicine";
            } else if (targetScreen === "history") {
                screenTitle.innerText = "Compliance Log";
            }
        });
    });

    // Left portfolio code tabs
    const codeTabs = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    codeTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            const targetTab = tab.dataset.tab;
            
            codeTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");
            
            tabContents.forEach(content => {
                content.classList.remove("active");
                if (content.id === `tab-${targetTab}`) {
                    content.classList.add("active");
                }
            });
        });
    });
}

// --- Time & Clock ---
function startPhoneClock() {
    const clockElement = document.getElementById("phone-time");
    
    function updateClock() {
        const now = new Date();
        clockElement.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    updateClock();
    setInterval(updateClock, 60000);
    
    // Set date header in App
    const dateLabel = document.getElementById("date-label");
    if (dateLabel) {
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        dateLabel.innerText = new Date().toLocaleDateString('en-US', options);
    }
}

// --- Form Handlers ---
function handleAddMedicine(e) {
    const name = document.getElementById("med-name").value.trim();
    const dosage = document.getElementById("med-dosage").value.trim();
    const type = document.getElementById("med-type").value;
    const timeValue = document.getElementById("med-time").value; // "HH:MM"
    const stock = parseInt(document.getElementById("med-stock").value) || 0;
    
    if (!name || !dosage || !timeValue) return;
    
    // Convert timeValue HH:MM to timeInMinutes
    const [hours, minutes] = timeValue.split(":").map(Number);
    const timeInMinutes = (hours * 60) + minutes;
    
    const newMed = {
        id: db.medicines.length > 0 ? Math.max(...db.medicines.map(m => m.id)) + 1 : 1,
        name,
        dosage,
        timeInMinutes,
        type,
        stock,
        isActive: true
    };
    
    db.medicines.push(newMed);
    saveDatabase();
    
    logConsole(`[Database]: Inserted medicine entity "${name}" (ID: ${newMed.id}).`, "success");
    logConsole(`[AlarmScheduler]: Scheduled exact alarm for ID: ${newMed.id} at ${formatTime(timeInMinutes)}.`, "info");
    
    // Clear form
    document.getElementById("add-medicine-form").reset();
    
    // Go back to home
    document.querySelector('.nav-tab[data-screen="home"]').click();
    
    renderAll();
}

// --- Render Operations ---
function renderAll() {
    renderMedicinesList();
    renderHistoryList();
    renderComplianceStats();
}

function renderMedicinesList() {
    const listElement = document.getElementById("medicines-list");
    const countBadge = document.getElementById("active-meds-count");
    if (!listElement) return;
    
    listElement.innerHTML = "";
    
    const activeMeds = db.medicines.filter(m => m.isActive);
    countBadge.innerText = activeMeds.length;
    
    if (activeMeds.length === 0) {
        listElement.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-prescription-bottle"></i>
                <p>No medications configured. Click the + button below to add one.</p>
            </div>
        `;
        return;
    }
    
    // Sort by time
    activeMeds.sort((a, b) => a.timeInMinutes - b.timeInMinutes);
    
    activeMeds.forEach(med => {
        const card = document.createElement("div");
        card.className = "med-card";
        
        let typeIcon = "fa-pill";
        let typeClass = "pill";
        if (med.type === "Syrup") {
            typeIcon = "fa-bottle-droplet";
            typeClass = "syrup";
        } else if (med.type === "Injection") {
            typeIcon = "fa-syringe";
            typeClass = "injection";
        }
        
        // Stock rendering
        let stockHtml = "";
        if (med.stock === 0) {
            stockHtml = `<span class="stock-warning stock-empty"><i class="fa-solid fa-circle-exclamation"></i> Out of Stock</span>`;
        } else if (med.stock <= 3) {
            stockHtml = `<span class="stock-warning stock-low"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock: ${med.stock} left</span>`;
        } else {
            stockHtml = `<span class="stock-warning stock-ok">${med.stock} doses left</span>`;
        }
        
        card.innerHTML = `
            <div class="med-card-top">
                <div class="med-icon-wrapper ${typeClass}">
                    <i class="fa-solid ${typeIcon}"></i>
                </div>
                <div class="med-info">
                    <h4>${med.name}</h4>
                    <p>${med.dosage} &bull; ${med.type}</p>
                </div>
                <div class="med-time-badge">
                    <i class="fa-regular fa-clock"></i> ${formatTime(med.timeInMinutes)}
                </div>
            </div>
            <div class="med-card-bottom">
                ${stockHtml}
                <div class="med-actions">
                    <button class="med-btn med-btn-snooze" onclick="snoozeDose(${med.id})">Snooze</button>
                    <button class="med-btn med-btn-take" onclick="takeDoseDirectly(${med.id})">Take</button>
                </div>
            </div>
        `;
        
        listElement.appendChild(card);
    });
}

function renderHistoryList() {
    const listElement = document.getElementById("history-list");
    if (!listElement) return;
    
    listElement.innerHTML = "";
    
    if (db.doseLogs.length === 0) {
        listElement.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <p>No history logs generated yet. Schedule reminders and log compliance to build history.</p>
            </div>
        `;
        return;
    }
    
    // Sort logs descending
    const sortedLogs = [...db.doseLogs].sort((a, b) => b.scheduledTime - a.scheduledTime);
    
    sortedLogs.forEach(log => {
        const med = db.medicines.find(m => m.id === log.medicineId) || { name: "Unknown Medicine", dosage: "" };
        const item = document.createElement("div");
        item.className = "history-item";
        
        let dateString = new Date(log.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' });
        let timeString = new Date(log.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let takenDetails = "";
        if (log.status === "TAKEN" && log.takenTime) {
            const takenTimeStr = new Date(log.takenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            takenDetails = `<span class="text-system">Taken at ${takenTimeStr}</span>`;
        } else if (log.status === "MISSED") {
            takenDetails = `<span class="text-danger">Unresponsive timeout check</span>`;
        } else {
            takenDetails = `<span class="text-warning">Awaiting user confirmation</span>`;
        }
        
        item.innerHTML = `
            <div class="history-item-left">
                <h5>${med.name} (${med.dosage})</h5>
                <span>Scheduled: ${dateString} at ${timeString}</span>
                ${takenDetails}
            </div>
            <div class="status-badge ${log.status.toLowerCase()}">${log.status}</div>
        `;
        
        listElement.appendChild(item);
    });
}

function renderComplianceStats() {
    const compliancePercent = document.getElementById("compliance-percent");
    const progressValText = document.getElementById("progress-val-text");
    const progressPath = document.getElementById("compliance-progress-path");
    const complianceText = document.getElementById("compliance-text");
    const miniRing = document.getElementById("compliance-mini-ring");
    
    // Calculate compliance based on non-pending items
    const auditedLogs = db.doseLogs.filter(log => log.status !== "PENDING");
    
    let rate = 100;
    if (auditedLogs.length > 0) {
        const takenCount = auditedLogs.filter(log => log.status === "TAKEN").length;
        rate = Math.round((takenCount / auditedLogs.length) * 100);
    }
    
    // Update labels
    compliancePercent.innerText = `${rate}%`;
    progressValText.innerText = `${rate}%`;
    miniRing.innerText = `${rate}%`;
    
    // Update SVG stroke-dasharray
    if (progressPath) {
        const val = (rate / 100) * 100; // max is 100
        progressPath.setAttribute("stroke-dasharray", `${val}, 100`);
    }
    
    // Set ring color based on rate
    if (rate >= 80) {
        miniRing.style.borderColor = "var(--color-emerald)";
        miniRing.style.color = "var(--color-emerald)";
        if (progressPath) progressPath.style.stroke = "var(--color-emerald)";
        complianceText.innerText = "Excellent adherence! Keep setting exact reminders.";
    } else if (rate >= 50) {
        miniRing.style.borderColor = "var(--color-amber)";
        miniRing.style.color = "var(--color-amber)";
        if (progressPath) progressPath.style.stroke = "var(--color-amber)";
        complianceText.innerText = "Warning: Compliance drops. Ensure alerts are not snoozed.";
    } else {
        miniRing.style.borderColor = "var(--color-rose)";
        miniRing.style.color = "var(--color-rose)";
        if (progressPath) progressPath.style.stroke = "var(--color-rose)";
        complianceText.innerText = "Critical compliance level. Missed doses could spark alerts.";
    }
}

// --- Interactive Simulation Logic ---

function setupSimulatorControls() {
    document.getElementById("btn-trigger-alarm").addEventListener("click", triggerReminderAlarm);
    document.getElementById("btn-fast-forward").addEventListener("click", fastForwardOneHour);
    document.getElementById("btn-trigger-emergency").addEventListener("click", forceEmergencyAlert);
    document.getElementById("btn-reset-db").addEventListener("click", resetToDefaults);
}

// 1. Trigger Scheduled Alarm
function triggerReminderAlarm() {
    if (db.medicines.length === 0) {
        logConsole("[AlarmScheduler]: No active medicines inside Room DB to trigger.", "warning");
        return;
    }
    
    // Choose one medicine to trigger (cyclically or randomly)
    const randomIndex = Math.floor(Math.random() * db.medicines.length);
    const med = db.medicines[randomIndex];
    
    logConsole(`[AlarmManager]: Broadcast wakeup intent triggered for Med ID: ${med.id}`, "info");
    logConsole(`[ReminderReceiver]: Broadcast received. Opening database transaction.`, "info");
    
    // Create pending log in DB
    const newLogId = db.doseLogs.length > 0 ? Math.max(...db.doseLogs.map(l => l.id)) + 1 : 1000;
    const newLog = {
        id: newLogId,
        medicineId: med.id,
        scheduledTime: Date.now(),
        takenTime: null,
        status: "PENDING"
    };
    
    db.doseLogs.push(newLog);
    saveDatabase();
    
    logConsole(`[Database]: Log ID ${newLog.id} inserted (Status: PENDING).`, "success");
    logConsole(`[NotificationHelper]: Firing reminder channel notification. High-Priority.`, "info");
    
    // Trigger UI notification banner in phone
    showSystemNotification(med, newLog.id);
    renderAll();
}

function showSystemNotification(medicine, logId) {
    currentPendingNotif = { medicine, logId };
    
    const drawer = document.getElementById("notification-drawer");
    const textEl = document.getElementById("notification-text");
    
    textEl.innerText = `It's time to take your medicine: ${medicine.name} (${medicine.dosage})`;
    drawer.classList.remove("hidden");
    // Simple micro-delay to trigger active CSS transition
    setTimeout(() => {
        drawer.classList.add("active");
    }, 50);
    
    // Custom phone vibration simulation
    const phone = document.querySelector(".phone-frame");
    phone.classList.add("anim-shake");
    setTimeout(() => {
        phone.classList.remove("anim-shake");
    }, 500);
}

// 2. Click Taken in Notification Drawer
function handleNotificationTaken() {
    if (!currentPendingNotif) return;
    
    const { medicine, logId } = currentPendingNotif;
    hideNotificationDrawer();
    
    logConsole(`[BroadcastReceiver]: ActionReceiver intercepted click broadcast (ACTION_TAKEN).`, "action");
    
    // Update local database log
    const log = db.doseLogs.find(l => l.id === logId);
    const dbMed = db.medicines.find(m => m.id === medicine.id);
    
    if (log && log.status === "PENDING") {
        log.status = "TAKEN";
        log.takenTime = Date.now();
        
        // Deduct stock
        if (dbMed && dbMed.stock > 0) {
            dbMed.stock -= 1;
            logConsole(`[Database]: Deducting stock for Med ID: ${dbMed.id}. New stock: ${dbMed.stock}`, "success");
        } else if (dbMed && dbMed.stock === 0) {
            logConsole(`[Database]: Warning: Med ID: ${dbMed.id} is out of stock!`, "warning");
        }
        
        saveDatabase();
        logConsole(`[Database]: DoseLog ID ${logId} updated to TAKEN. Transaction complete.`, "success");
    } else {
        logConsole(`[ActionReceiver]: Duplicate notification click rejected. State protected.`, "warning");
    }
    
    currentPendingNotif = null;
    renderAll();
}

function handleNotificationSnooze() {
    if (!currentPendingNotif) return;
    
    const { medicine } = currentPendingNotif;
    hideNotificationDrawer();
    
    logConsole(`[BroadcastReceiver]: ActionReceiver intercepted click broadcast (ACTION_SNOOZE).`, "action");
    logConsole(`[AlarmScheduler]: Scheduled exact alarm reschedule in +15 minutes for "${medicine.name}".`, "info");
    
    // Create visual Toast simulation inside app
    showToast(`Reminder for ${medicine.name} snoozed.`);
    
    currentPendingNotif = null;
    renderAll();
}

function hideNotificationDrawer() {
    const drawer = document.getElementById("notification-drawer");
    drawer.classList.remove("active");
    setTimeout(() => {
        drawer.classList.add("hidden");
    }, 400);
}

// Direct button "Take" on UI
window.takeDoseDirectly = function(medId) {
    const med = db.medicines.find(m => m.id === medId);
    if (!med) return;
    
    logConsole(`[MainActivity]: User logged dose manually from Dashboard.`, "action");
    
    // Create log immediately as TAKEN
    const newLogId = db.doseLogs.length > 0 ? Math.max(...db.doseLogs.map(l => l.id)) + 1 : 1000;
    const newLog = {
        id: newLogId,
        medicineId: med.id,
        scheduledTime: Date.now(),
        takenTime: Date.now(),
        status: "TAKEN"
    };
    
    db.doseLogs.push(newLog);
    
    // Deduct stock
    if (med.stock > 0) {
        med.stock -= 1;
    }
    
    saveDatabase();
    logConsole(`[Database]: Inserted TAKEN log ID ${newLog.id}. Stock count: ${med.stock}`, "success");
    
    renderAll();
};

window.snoozeDose = function(medId) {
    const med = db.medicines.find(m => m.id === medId);
    if (!med) return;
    logConsole(`[MainActivity]: Snoozed medicine ID: ${medId} from Dashboard.`, "action");
    logConsole(`[AlarmScheduler]: Scheduled exact alarm reschedule in +15 minutes.`, "info");
    showToast(`Snoozed ${med.name} for 15m.`);
};

// 3. Fast-Forward 1 Hour (Checks for missed doses)
function fastForwardOneHour() {
    logConsole(`[AlarmManager]: Triggered MissedDoseReceiver hourly check.`, "info");
    logConsole(`[MissedDoseReceiver]: Inspecting pending database reminders...`, "info");
    
    const pendingLogs = db.doseLogs.filter(l => l.status === "PENDING");
    
    if (pendingLogs.length === 0) {
        logConsole(`[MissedDoseReceiver]: No pending reminders found. Zero action required.`, "info");
        return;
    }
    
    let stateChanged = false;
    
    pendingLogs.forEach(log => {
        log.status = "MISSED";
        stateChanged = true;
        
        const med = db.medicines.find(m => m.id === log.medicineId) || { name: "Med" };
        logConsole(`[Database]: Log ID ${log.id} (${med.name}) timed out -> Updated to MISSED.`, "danger");
        
        // Check for 3 consecutive missed doses of this specific medicine
        checkEmergencyCompliance(log.medicineId);
    });
    
    // Dismiss active notification if there is any (it was missed)
    if (currentPendingNotif) {
        hideNotificationDrawer();
        currentPendingNotif = null;
    }
    
    if (stateChanged) {
        saveDatabase();
        renderAll();
    }
}

function checkEmergencyCompliance(medicineId) {
    // Sort logs descending by scheduledTime
    const medLogs = db.doseLogs
        .filter(l => l.medicineId === medicineId)
        .sort((a, b) => b.scheduledTime - a.scheduledTime);
    
    // Check if the latest 3 logs are MISSED
    if (medLogs.length >= 3) {
        const lastThreeStatuses = medLogs.slice(0, 3).map(l => l.status);
        const allMissed = lastThreeStatuses.every(status => status === "MISSED");
        
        logConsole(`[MissedDoseReceiver]: Adherence audit for Med ID ${medicineId}: Last 3 states = [${lastThreeStatuses.join(", ")}]`, "info");
        
        if (allMissed) {
            logConsole(`[MissedDoseReceiver]: CRITICAL: 3 consecutive misses! Dispatching Emergency Broadcast...`, "danger");
            triggerEmergencyAlert();
        }
    }
}

// 4. Force Emergency Alert
function forceEmergencyAlert() {
    logConsole(`[Simulator]: Manually forcing Critical Emergency Notification.`, "warning");
    triggerEmergencyAlert();
}

function triggerEmergencyAlert() {
    logConsole(`[NotificationHelper]: Dispatched SYSTEM_ALERT channel notification (Emergency broadcast).`, "danger");
    
    const overlay = document.getElementById("emergency-overlay");
    overlay.classList.remove("hidden");
    
    // Simulate high alert sound/flash
    // In Android: play default ringtone, wake up locked screen, launch full screen intent.
}

function closeEmergencyOverlay() {
    const overlay = document.getElementById("emergency-overlay");
    overlay.classList.add("hidden");
    logConsole(`[MainActivity]: Emergency alert acknowledged by user. Warding off notifications.`, "system");
}

// --- General Helpers ---
function formatTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const displayMinutes = m < 10 ? `0${m}` : m;
    return `${displayHour}:${displayMinutes} ${ampm}`;
}

// Simple Toast Helper
function showToast(message) {
    const toast = document.createElement("div");
    toast.style.position = "absolute";
    toast.style.bottom = "80px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.background = "rgba(15, 21, 36, 0.9)";
    toast.style.border = "1px solid rgba(255, 255, 255, 0.1)";
    toast.style.color = "#ffffff";
    toast.style.padding = "8px 16px";
    toast.style.borderRadius = "20px";
    toast.style.fontSize = "0.72rem";
    toast.style.fontWeight = "600";
    toast.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
    toast.style.zIndex = "1000";
    toast.style.whiteSpace = "nowrap";
    toast.style.animation = "itemPop 0.25s ease-out";
    
    const appContainer = document.querySelector(".app-container");
    appContainer.appendChild(toast);
    toast.innerText = message;
    
    setTimeout(() => {
        toast.style.transition = "opacity 0.3s ease";
        toast.style.opacity = "0";
        setTimeout(() => {
            appContainer.removeChild(toast);
        }, 300);
    }, 2000);
}

// Add shake animation style to stylesheet dynamically for notifications
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes shakePhone {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    10%, 30%, 50%, 70%, 90% { transform: translate(-3px, 0) rotate(-0.5deg); }
    20%, 40%, 60%, 80% { transform: translate(3px, 0) rotate(0.5deg); }
}
.anim-shake {
    animation: shakePhone 0.4s ease-in-out;
}
`;
document.head.appendChild(styleSheet);
