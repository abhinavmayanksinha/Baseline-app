// GLOBAL STATE
let checkInHistory = [];
let selectedMood = null;
let selectedEnergy = null;
let selectedStress = null;

// NAVIGATION
let currentUser = null; // Add this global variable
function login() {
    const nameInput = document.getElementById('usernameInput');
    const name = nameInput.value.trim();

    if (!name) {
        alert("Please enter a name to continue.");
        return;
    }

    currentUser = name;
    // Save current session
    localStorage.setItem('currentUser', currentUser); 
    
    // Load the data for this specific user
    loadUserData();
    
    // Switch Views: Hide Login, Show App
    document.getElementById('loginView').classList.add('hidden');
    document.getElementById('appView').classList.remove('hidden');
    
    // Default to the check-in view
    showView('checkin');
}

function saveCheckIn(entry) {
    // OLD: const key = 'baselineData';
    // NEW: Unique key for every user
    const key = `baselineData_${currentUser}`; 
    
    let history = JSON.parse(localStorage.getItem(key)) || [];
    history.push(entry);
    localStorage.setItem(key, JSON.stringify(history));
}

function loadUserData() {
    const key = `baselineData_${currentUser}`;
    const saved = localStorage.getItem(key);
    checkInHistory = saved ? JSON.parse(saved) : [];
    
    // Refresh the UI with this user's data
    renderChart();
}

function logout() {
    localStorage.removeItem('currentUser'); // Only forget WHO is logged in
    currentUser = null;
    checkInHistory = [];
    location.reload(); // Returns to the login screen
}

function showView(viewName) {
    // List of all section IDs
    const views = ['checkin', 'moodData', 'improveMood', 'miniResets'];
    
    views.forEach(v => {
        const el = document.getElementById(v + 'View');
        if (el) el.classList.add('hidden');
    });

    const active = document.getElementById(viewName + 'View');
    if (active) active.classList.remove('hidden');

    if (viewName === 'moodData') {
        renderChart();
    }
}
//    BUTTON SELECTION LOGIC

function setupButtons(selector, callback) {
  const buttons = document.querySelectorAll(selector);
  buttons.forEach(btn => {
    btn.onclick = () => {
      buttons.forEach(b =>
        b.classList.remove('bg-gray-200', 'ring-2', 'ring-brandPurple')
      );
      btn.classList.add('bg-gray-200', 'ring-2', 'ring-brandPurple');
      callback(btn.innerText);
    };
  });
}

setupButtons('.mood-btn', v => selectedMood = v);
setupButtons('.energy-btn', v => selectedEnergy = v);
setupButtons('.stress-btn', v => selectedStress = v);


//    GEMINI AI LOGIC
async function askGemini() {
    const box = document.getElementById('todayInsight');
    const journalText = document.getElementById('journalEntry').value.trim() || 
      `The user is feeling ${selectedMood} with ${selectedEnergy} energy.`;
    box.innerText = "Consulting the baseline...";

    // Updated URL to ensure the most compatible 2025 endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
// Inside askGemini() prompt text:
text: `User Stats: Mood ${selectedMood}, Energy ${selectedEnergy}, Stress ${selectedStress}. 
       Note: "${journalText}". 
       TASK: Give 2 sentences of wellness advice. 
       CRITICAL: If the user note suggests self-harm or a severe mental health crisis, 
       start your response with the exact word "SOS:".`            }]
        }],
        generationConfig: {
            temperature: 0.2, 
            maxOutputTokens: 1000
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // Log this to your console so you can see the real error if it fails again
        console.log("Gemini API Data:", data);

        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts) {
            const aiText = data.candidates[0].content.parts[0].text.trim();
            if (aiText.toUpperCase().startsWith("SOS:")) {
            triggerSOS('ai_detection');
            return; // Stop here so it doesn't try to update the text box
            }
            // This is the winner! Update the box.
            box.innerText = aiText;
        } else if (data.error) {
            // This will show you the ACTUAL error from Google (like "API Key Invalid")
            box.innerText = "API Error: " + data.error.message;
        } else {
            box.innerText = "The AI is resetting. Try typing a specific note in the reflection box!";
        }
    } catch (error) {
        console.error("AI Error:", error);
        box.innerText = "Connection lost. Please check your internet.";
    }
}

function triggerSOS(reason) {
    console.log("SOS Triggered:", reason);
    
    // Hide the main app view
    document.getElementById('appView').classList.add('hidden');
    
    // Show the SOS view
    const resourcesView = document.getElementById('resourcesView');
    resourcesView.classList.remove('hidden');
    
    // Update the message text inside the SOS view
    const msgElement = document.getElementById('sosMessage');
    if (reason === 'pattern') {
        msgElement.innerText = "We've noticed a pattern of high stress and low mood over your last few check-ins. We're here for you.";
    } else {
        msgElement.innerText = "Based on your current reflection, we want to make sure you have immediate support and resources.";
    }
}

// Gemini Logic for Improve Mood Button

async function getPersonalizedTips() {
    const listContainer = document.getElementById('improveMoodList');
    listContainer.innerHTML = "<li class='text-brandPurple animate-pulse'>Tailoring suggestions...</li>";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`;

    const requestBody = {
        contents: [{
            parts: [{
                text: `The user is feeling: Mood ${selectedMood}, Energy ${selectedEnergy}, Stress ${selectedStress}. 
                       Provide 3 very short, actionable "Improve Mood" tips (max 10 words each). 
                       Format them as a simple list. Do not use generic cliches.`
            }]
        }],
        generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 500 // Using a safe limit for stability
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            const text = data.candidates[0].content.parts[0].text;
            // Split by lines or numbers to create clean list items
            const tips = text.split(/\d\.\s|•|\n/).filter(t => t.trim().length > 5);
            
            listContainer.innerHTML = ""; // Clear loader
            tips.slice(0, 3).forEach(tip => {
                const li = document.createElement('li');
                li.className = "p-2 bg-gray-50 rounded-lg border-l-4 border-brandPink";
                li.innerText = tip.trim();
                listContainer.appendChild(li);
            });
        }
    } catch (error) {
        listContainer.innerHTML = "<li>Take 3 deep breaths.</li><li>Step outside for fresh air.</li><li>Stretch your shoulders.</li>";
    }
}





//    SUBMIT CHECK-IN
document.getElementById('submitBtn').onclick = () => {
  if (!selectedMood || !selectedEnergy || !selectedStress) {
    alert("Please complete all check-in fields.");
    return;
  }

  const entry = {
    mood: selectedMood,
    energy: selectedEnergy,
    stress: selectedStress,
    timestamp: new Date().toISOString()
  };

  // NEW: Save to the user-specific history
  saveCheckIn(entry); 
  
  // Sync the local global variable so the chart updates instantly
  checkInHistory.unshift(entry);

  document.getElementById('successMessage').classList.remove('hidden');
  setTimeout(() => document.getElementById('successMessage').classList.add('hidden'), 3000);

  checkPattern(); // Check if the last 3 days were rough
  askGemini();
  getPersonalizedTips();
  document.getElementById('journalEntry').value = "";


  function checkPattern() {
    if (checkInHistory.length < 3) return;

    // Check last 3 entries for "😞" or "😔" AND "High" stress
    const crisisCount = checkInHistory.slice(0, 3).filter(entry => 
        (entry.mood === '😞' || entry.mood === '😔') && entry.stress === 'High'
    ).length;

    if (crisisCount >= 3) {
        triggerSOS('pattern');
    }
}
};


//    CHART LOGIC

let moodChart = null;

function renderChart() {
  const canvas = document.getElementById('moodChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  
  // If history is empty, destroy the old chart and clear the canvas
  if (checkInHistory.length === 0) {
    if (moodChart) {
      moodChart.destroy();
      moodChart = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('moodDataContent').innerText = "No data available. Start checking in!";
    return;
  }

  if (moodChart) moodChart.destroy();
  
  // ... rest of your existing chart code ...

  const moodMap = { '😊': 5, '🙂': 4, '😐': 3, '😔': 2, '😞': 1 };

  moodChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: checkInHistory.map((_, i) => i + 1).reverse(),
      datasets: [{
        label: 'Mood Level',
        data: checkInHistory.map(e => moodMap[e.mood] || 3).reverse(),
        borderColor: '#6A1CF7', // Your brandPurple
        backgroundColor: 'rgba(106, 28, 247, 0.1)', // Light purple fill
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      scales: {
        y: { min: 1, max: 5 }
      }
    }
  });
}


// Mini Resets

function startResetTimer() {
  const display = document.getElementById('timerDisplay');
  const message = document.getElementById('timerMessage');
  const btn = document.getElementById('startTimerBtn');
  let timeLeft = 30;

  btn.disabled = true;
  btn.classList.add('opacity-50');

  const timer = setInterval(() => {
    timeLeft--;
    display.innerText = timeLeft;

    // Pulse effect: Expand on inhale, contract on exhale
    if (timeLeft % 8 >= 4) {
      display.style.transform = "scale(1.1)";
      message.innerText = "Breathe In...";
    } else {
      display.style.transform = "scale(0.9)";
      message.innerText = "Breathe Out...";
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      display.innerText = "30";
      display.style.transform = "scale(1)";
      message.innerText = "Great job. You've reset your baseline.";
      btn.disabled = false;
      btn.classList.remove('opacity-50');
    }
  }, 1000);
}



//    LOAD SAVED DATA

window.onload = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = savedUser;
        loadUserData();
        // Skip login screen
        document.getElementById('loginView').classList.add('hidden');
        document.getElementById('appView').classList.remove('hidden');
        showView('checkin');
    }
};

