// ========================= State Variables =========================
let currentMode = 'wakeAt';
let sleepLatency = 15;
let audioContext = null;
let activeSoundNode = null;
let currentPlayingSound = null;
let sleepNowTimer = null;
let selectedNapMinutes = null;

// ========================= Theme Toggle =========================
const themeToggleBtn = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

function setTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        themeIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        themeIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
    }
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    setTheme(false);
} else {
    setTheme(true);
}

themeToggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(!isDark);
});

// ========================= Mobile Menu =========================
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle('open');
    mobileMenuBtn.setAttribute('aria-expanded', mobileMenu.classList.contains('open'));
    const icon = mobileMenuBtn.querySelector('svg');
    if (mobileMenu.classList.contains('open')) {
        icon.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    } else {
        icon.innerHTML = '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>';
    }
});

// Close mobile menu on link click
document.querySelectorAll('.mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        mobileMenuBtn.querySelector('svg').innerHTML = '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>';
    });
});

// ========================= Switch Calculator Modes =========================
function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });

    const activeTab = document.getElementById(`tab-${mode}`);
    if (activeTab) {
        activeTab.classList.add('active');
        activeTab.setAttribute('aria-selected', 'true');
    }

    const timeWrapper = document.getElementById('time-input-wrapper');
    const timeLabel = document.getElementById('time-label');
    const targetTimeInput = document.getElementById('target-time');

    if (mode === 'wakeAt') {
        timeWrapper.style.display = 'block';
        timeLabel.innerText = 'Target Wake Up Time';
    } else if (mode === 'sleepAt') {
        timeWrapper.style.display = 'block';
        timeLabel.innerText = 'Target Bedtime';
    } else if (mode === 'sleepNow') {
        timeWrapper.style.display = 'none';
        startSleepNowAutoRefresh();
    } else if (mode === 'napMode') {
        timeWrapper.style.display = 'none';
    }

    if (mode !== 'sleepNow' && sleepNowTimer) {
        clearInterval(sleepNowTimer);
        sleepNowTimer = null;
    }

    calculateCycles();
}

// ========================= Auto-Refresh Sleep Now =========================
function startSleepNowAutoRefresh() {
    if (sleepNowTimer) clearInterval(sleepNowTimer);
    sleepNowTimer = setInterval(() => {
        if (currentMode === 'sleepNow') calculateCycles();
    }, 60000);
}

// ========================= Latency Update =========================
function updateLatency(val) {
    sleepLatency = parseInt(val, 10);
    document.getElementById('latency-val').innerText = `${val} min`;
    calculateCycles();
}

// ========================= Time Formatting =========================
function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return {
        display: `${hours}:${minutes}`,
        ampm: ampm,
        full: `${hours}:${minutes} ${ampm}`
    };
}

// ========================= Google Calendar URL Generator =========================
function generateGoogleCalendarUrl(eventTitle, date) {
    const pad = (n) => String(n).padStart(2, '0');
    const startYear = date.getFullYear();
    const startMonth = pad(date.getMonth() + 1);
    const startDay = pad(date.getDate());
    const startHours = pad(date.getHours());
    const startMinutes = pad(date.getMinutes());

    const endDate = new Date(date.getTime() + 30 * 60000);
    const endYear = endDate.getFullYear();
    const endMonth = pad(endDate.getMonth() + 1);
    const endDay = pad(endDate.getDate());
    const endHours = pad(endDate.getHours());
    const endMinutes = pad(endDate.getMinutes());

    const start = `${startYear}${startMonth}${startDay}T${startHours}${startMinutes}00`;
    const end = `${endYear}${endMonth}${endDay}T${endHours}${endMinutes}00`;

    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${start}/${end}`;
}

// ========================= Main Calculation Engine =========================
function calculateCycles() {
    const cardsGrid = document.getElementById('cards-grid');
    const resultsTitle = document.getElementById('results-title');
    const resultsSubtitle = document.getElementById('results-subtitle');
    cardsGrid.innerHTML = '';

    let baseDate = new Date();
    const timeInput = document.getElementById('target-time').value;

    if (currentMode === 'wakeAt' || currentMode === 'sleepAt') {
        if (timeInput) {
            const [h, m] = timeInput.split(':').map(Number);
            baseDate.setHours(h, m, 0, 0);
        } else {
            baseDate.setHours(6, 30, 0, 0);
        }

        const now = new Date();
        if (currentMode === 'wakeAt') {
            if (baseDate <= now) baseDate.setDate(baseDate.getDate() + 1);
        } else if (currentMode === 'sleepAt') {
            if (baseDate < now) baseDate.setDate(baseDate.getDate() + 1);
        }
    }

    // MODE 1: Wake At -> Calculate Bedtimes
    if (currentMode === 'wakeAt') {
        resultsTitle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg> Estimated Bedtimes to Wake At ' + formatTime(baseDate).full;
        resultsSubtitle.innerText = `Count back by approximate 90-minute cycles + ${sleepLatency} minutes estimated to fall asleep:`;

        const cycleConfigs = [
            { cycles: 6, label: 'Extended Sleep Option', desc: '~9.0 hrs sleep', tag: 'Extended sleep planning option', color: 'emerald' },
            { cycles: 5, label: 'Common Planning Option', desc: '~7.5 hrs sleep', tag: 'Most common adult planning target', color: 'indigo' },
            { cycles: 4, label: 'Short Sleep Example', desc: '~6.0 hrs sleep', tag: 'Short sleep example; not a regular target', color: 'sky' },
            { cycles: 3, label: 'Short Sleep Example', desc: '~4.5 hrs sleep', tag: 'Short sleep example; not recommended for regular use', color: 'amber' }
        ];

        cycleConfigs.forEach(item => {
            const bedDate = new Date(baseDate.getTime() - (item.cycles * 90 * 60000) - (sleepLatency * 60000));
            renderResultCard(bedDate, item.cycles, item.label, item.desc, item.tag, 'Go to bed at:', 'Sleep Preparation');
        });
    }

    // MODE 2: Sleep At -> Calculate Wake Times
    else if (currentMode === 'sleepAt') {
        resultsTitle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> Estimated Wake Times After Going to Bed at ' + formatTime(baseDate).full;
        resultsSubtitle.innerText = `Adding ${sleepLatency} min to fall asleep + approximate 90-minute cycles:`;

        const cycleConfigs = [
            { cycles: 3, label: 'Short Sleep Example', desc: '~4.5 hrs sleep', tag: 'Short sleep example; not recommended for regular use', color: 'amber' },
            { cycles: 4, label: 'Short Sleep Example', desc: '~6.0 hrs sleep', tag: 'Short sleep example; not a regular target', color: 'sky' },
            { cycles: 5, label: 'Common Planning Option', desc: '~7.5 hrs sleep', tag: 'Most common adult planning target', color: 'indigo' },
            { cycles: 6, label: 'Extended Sleep Option', desc: '~9.0 hrs sleep', tag: 'Extended sleep planning option', color: 'emerald' }
        ];

        cycleConfigs.forEach(item => {
            const wakeDate = new Date(baseDate.getTime() + (sleepLatency * 60000) + (item.cycles * 90 * 60000));
            renderResultCard(wakeDate, item.cycles, item.label, item.desc, item.tag, 'Set alarm for:', 'Wake Up');
        });
    }

    // MODE 3: Sleeping Right Now
    else if (currentMode === 'sleepNow') {
        const now = new Date();
        resultsTitle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M19 3l3 3"/></svg> If You Fall Asleep Now...';
        resultsSubtitle.innerText = `Assuming ~${sleepLatency} min to drift off, estimated wake times:`;

        const cycleConfigs = [
            { cycles: 3, label: 'Short Sleep Example', desc: '~4.5 hrs in bed', tag: 'Short sleep example; not recommended for regular use', color: 'amber' },
            { cycles: 4, label: 'Short Sleep Example', desc: '~6.0 hrs in bed', tag: 'Short sleep example; not a regular target', color: 'sky' },
            { cycles: 5, label: 'Common Planning Option', desc: '~7.5 hrs in bed', tag: 'Most common adult planning target', color: 'indigo' },
            { cycles: 6, label: 'Extended Sleep Option', desc: '~9.0 hrs in bed', tag: 'Extended sleep planning option', color: 'emerald' }
        ];

        cycleConfigs.forEach(item => {
            const wakeDate = new Date(now.getTime() + (sleepLatency * 60000) + (item.cycles * 90 * 60000));
            renderResultCard(wakeDate, item.cycles, item.label, item.desc, item.tag, 'Set alarm for:', 'Wake Up');
        });
    }

    // MODE 4: Nap Modes
    else if (currentMode === 'napMode') {
        const now = new Date();
        resultsTitle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Nap Presets (Total Time From Now)';
        resultsSubtitle.innerText = `Estimated wake times from now. Sleep latency is NOT added to nap duration.`;

        const naps = [
            { mins: 20, label: 'Power Nap', desc: 'Light sleep stage', tag: 'May boost alertness', color: 'amber' },
            { mins: 45, label: 'Caffeine Boost Nap', desc: 'Pre-slow wave exit', tag: 'Try espresso before', color: 'sky' },
            { mins: 90, label: 'Full Cycle Nap', desc: 'One approximate cycle', tag: 'May aid creativity', color: 'indigo' },
            { mins: 120, label: 'Extended Nap', desc: 'Situational recovery', tag: 'For fatigue catch-up', color: 'emerald' }
        ];

        naps.forEach(nap => {
            const wakeDate = new Date(now.getTime() + (nap.mins * 60000));
            const timeObj = formatTime(wakeDate);
            const isSelected = (selectedNapMinutes === nap.mins);

            const card = document.createElement('div');
            card.className = `result-card ${isSelected ? 'highlight' : ''}`;
            card.innerHTML = `
                <div class="result-card-top">
                    <span class="result-cycles">${nap.label}</span>
                    <span class="suggested-badge" style="background:${getColor(nap.color)}; font-size:0.5rem;">${nap.mins} min</span>
                </div>
                <div class="result-time">${timeObj.display} <span class="result-time-ampm">${timeObj.ampm}</span></div>
                <p class="result-desc">${nap.desc}</p>
                <div class="result-tag"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>${nap.tag}</div>
                <div class="result-actions">
                    <button onclick="copyToClipboard('${timeObj.full}')" class="result-action-btn copy"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</button>
                    <a href="${generateGoogleCalendarUrl('Nap Reminder', wakeDate)}" target="_blank" rel="noopener" class="result-action-btn cal"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>Add Cal</a>
                </div>
            `;
            cardsGrid.appendChild(card);
        });
    }
}

// Helper to get color hex from color name
function getColor(colorName) {
    const colors = {
        emerald: '#10b981',
        indigo: '#6366f1',
        sky: '#0ea5e9',
        amber: '#f59e0b'
    };
    return colors[colorName] || '#6366f1';
}

// ========================= Render Result Card =========================
function renderResultCard(date, cycles, label, desc, tag, actionLabel, eventTitle) {
    const cardsGrid = document.getElementById('cards-grid');
    const timeObj = formatTime(date);
    const isHighlight = cycles === 5;
    const calUrl = generateGoogleCalendarUrl(eventTitle || 'Sleep Reminder', date);

    const card = document.createElement('div');
    card.className = `result-card ${isHighlight ? 'highlight' : ''}`;
    card.innerHTML = `
        <div class="result-card-top">
            <span class="result-cycles">${cycles} Cycles</span>
            ${isHighlight ? '<span class="suggested-badge">Suggested</span>' : ''}
        </div>
        <span class="result-action">${actionLabel}</span>
        <div class="result-time">${timeObj.display} <span class="result-time-ampm">${timeObj.ampm}</span></div>
        <p class="result-desc">${desc}</p>
        <div class="result-tag"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>${tag}</div>
        <div class="result-actions">
            <button onclick="copyToClipboard('${timeObj.full}')" class="result-action-btn copy"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</button>
            <a href="${calUrl}" target="_blank" rel="noopener" class="result-action-btn cal"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>Add Cal</a>
        </div>
    `;
    cardsGrid.appendChild(card);
}

// ========================= Copy Helper =========================
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied ${text} to clipboard! Set your alarm accordingly.`);
        }).catch(() => {
            alert(`Alarm time: ${text}`);
        });
    } else {
        alert(`Alarm time: ${text}`);
    }
}

// ========================= Quick Nap Starter =========================
function startQuickNap(minutes) {
    selectedNapMinutes = minutes;
    switchMode('napMode');
    const targetEl = document.getElementById('results-area');
    if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth' });
}

// ========================= Sleep Debt Calculator =========================
function calculateSleepDebt() {
    const needed = parseFloat(document.getElementById('debt-needed').value);
    const actual = parseFloat(document.getElementById('debt-actual').value);
    const resultBox = document.getElementById('debt-result');

    if (isNaN(needed) || isNaN(actual) || needed <= 0 || actual <= 0) {
        resultBox.classList.add('visible');
        resultBox.innerHTML = '<div class="debt-result-title"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Please enter valid values.</div>';
        return;
    }

    const dailyDeficit = needed - actual;
    const weeklyDeficit = dailyDeficit * 7;

    resultBox.classList.add('visible');

    if (weeklyDeficit <= 0.5) {
        resultBox.innerHTML = '<div class="debt-result-title"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>Estimated Weekly Sleep Deficit: 0 hours</div><p>Based on the values entered, your estimated weekly sleep deficit is zero or below. Continue monitoring how you feel.</p>';
    } else {
        resultBox.innerHTML = `<div class="debt-result-title"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Estimated Weekly Sleep Deficit: <strong>${weeklyDeficit.toFixed(1)} hours</strong></div>
            <p>This estimated deficit may be associated with reduced alertness and cognitive performance.</p>
            <div class="debt-result-box">
                <strong>Suggested Recovery Plan (consult a physician for personalized advice):</strong><br>
                &bull; Avoid sleeping 3+ hours extra on weekends, which may disrupt your weekday rhythm.<br>
                &bull; Consider adding 45 minutes of sleep per night for the next week.<br>
                &bull; Consider a 20-minute afternoon nap between 1:00 PM and 3:00 PM.
            </div>`;
    }
}

// ========================= Web Audio API =========================
function initAudioContext() {
    if (!audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContext = new AudioContext();
    }
    if (audioContext.state === 'suspended') audioContext.resume();
}

function stopAudio() {
    if (activeSoundNode) {
        try {
            activeSoundNode.stop();
            activeSoundNode.disconnect();
        } catch (e) {}
        activeSoundNode = null;
    }
    currentPlayingSound = null;
    const status = document.getElementById('sound-status');
    status.innerText = 'Audio Idle';
    status.className = 'sound-status';

    ['rain', 'white', 'binaural'].forEach(type => {
        const btn = document.getElementById(`btn-sound-${type}`);
        if (btn) btn.classList.remove('active');
    });
}

function toggleAudio(type) {
    initAudioContext();

    if (currentPlayingSound === type) {
        stopAudio();
        return;
    }

    stopAudio();
    currentPlayingSound = type;
    const btn = document.getElementById(`btn-sound-${type}`);
    if (btn) btn.classList.add('active');

    const status = document.getElementById('sound-status');
    status.innerText = `Playing ${type === 'white' ? 'White Noise' : type === 'rain' ? 'Rain (Brownian)' : '4 Hz Binaural'}`;
    status.style.color = 'var(--teal)';

    if (type === 'white' || type === 'rain') {
        const bufferSize = audioContext.sampleRate * 2;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            if (type === 'rain') {
                lastOut = (lastOut + (0.02 * white)) / 1.02;
                data[i] = lastOut * 3.5;
            } else {
                data[i] = white * 0.15;
            }
        }

        const noise = audioContext.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = type === 'rain' ? 0.25 : 0.12;

        noise.connect(gainNode);
        gainNode.connect(audioContext.destination);
        noise.start();
        activeSoundNode = noise;

    } else if (type === 'binaural') {
        const merger = audioContext.createChannelMerger(2);
        const oscL = audioContext.createOscillator();
        oscL.frequency.value = 108;
        const oscR = audioContext.createOscillator();
        oscR.frequency.value = 112;
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.08;

        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscL.start();
        oscR.start();

        activeSoundNode = {
            stop: () => { oscL.stop(); oscR.stop(); },
            disconnect: () => { merger.disconnect(); }
        };
    }
}

// ========================= Modal System =========================
const modalOverlay = document.getElementById('modal-overlay');
const modalBody = document.getElementById('modal-body');

const modalContent = {
    privacy: `
        <h2 class="modal-title">Privacy Policy</h2>
        <div class="modal-body">
            <p>Last updated: August 2026</p>
            <p>SleepCalChq respects your privacy. This policy explains what data we collect and how it is used.</p>
            <h3>Local Storage</h3>
            <p>We use browser local storage to save your theme preference (dark/light mode) and settings. No data is transmitted to our servers.</p>
            <h3>Web Audio API</h3>
            <p>The ambient sound player uses Web Audio API to synthesize sounds locally in your browser. No audio data is recorded or transmitted.</p>
            <h3>Cookies</h3>
            <p>We do not use cookies or tracking pixels. Your usage of this tool is completely anonymous.</p>
            <h3>Third-party Services</h3>
            <p>We may use Google Fonts for typography. Google Fonts may collect IP addresses as part of their service. See Google's privacy policy for details.</p>
            <h3>Contact</h3>
            <p>For privacy concerns, contact supportsleepcalchq@gmail.com.</p>
        </div>
    `,
    terms: `
        <h2 class="modal-title">Terms of Service</h2>
        <div class="modal-body">
            <p>Last updated: August 2026</p>
            <p>By using SleepCalChq, you agree to these terms.</p>
            <h3>Acceptable Use</h3>
            <p>You may use this tool for personal, non-commercial purposes. You may not scrape, resell, or misrepresent the outputs of this tool.</p>
            <h3>Intellectual Property</h3>
            <p>All code, content, and branding associated with SleepCalChq are the property of SleepCalChq and may not be reproduced without permission.</p>
            <h3>Limitation of Liability</h3>
            <p>SleepCalChq provides estimates only. We are not liable for any decisions made based on our calculations. Always consult a qualified professional for health advice.</p>
            <h3>Changes</h3>
            <p>We may update these terms at any time. Continued use constitutes acceptance of the revised terms.</p>
        </div>
    `,
    methodology: `
        <h2 class="modal-title">Editorial Methodology</h2>
        <div class="modal-body">
            <p>SleepCalChq's calculations are based on established sleep science principles.</p>
            <h3>90-Minute Cycle Model</h3>
            <p>The approximate 90-minute ultradian sleep cycle is a widely cited average. Research by Dement & Kleitman (1957) established the basic REM/NREM cycle, and subsequent studies have confirmed cycle lengths of 70–120 minutes.</p>
            <h3>Sleep Latency Estimation</h3>
            <p>Average sleep latency in adults is approximately 15 minutes, though individual variations range from 5 to 60 minutes. Our calculator allows you to adjust this.</p>
            <h3>Circadian Rhythm Research</h3>
            <p>Our content draws on research from chronobiology, including the work of Charles Czeisler and Till Roenneberg on circadian phase alignment.</p>
            <h3>Validation</h3>
            <p>Our algorithms are tested against published sleep-cycle research. However, all outputs are estimates and should be treated as planning tools, not medical prescriptions.</p>
        </div>
    `,
    medical: `
        <h2 class="modal-title">Medical Disclaimer</h2>
        <div class="modal-body">
            <p>SleepCalChq is an educational tool that models approximate 90-minute sleep-cycle timing.</p>
            <h3>Not Medical Advice</h3>
            <p>The information provided on this website is for general informational purposes only and is not medical advice. It is not intended to diagnose, treat, cure, or prevent any disease or health condition.</p>
            <h3>Consult a Professional</h3>
            <p>If you are experiencing chronic insomnia, sleep apnea, or any other sleep disorder, please consult a board-certified sleep specialist or your primary healthcare provider.</p>
            <h3>No Guarantee of Results</h3>
            <p>Sleep patterns vary significantly between individuals. The times generated by this tool are estimates and may not work for everyone.</p>
        </div>
    `,
    contact: `
        <h2 class="modal-title">Contact Us</h2>
        <div class="modal-body">
            <p>We'd love to hear from you!</p>
            <p>For general inquiries, support, or feedback, please email us at:</p>
            <p style="font-size:1.25rem; font-weight:bold; color: var(--violet);">supportsleepcalchq@gmail.com</p>
            <p>We typically respond within 2–3 business days.</p>
            <h3>Partnerships</h3>
            <p>For partnership or sponsorship inquiries, include "Partnership" in the subject line.</p>
        </div>
    `,
    caffeine: `
        <h2 class="modal-title">Caffeine Halflife Clock</h2>
        <div class="modal-body">
            <p>This feature is currently in development. Stay tuned for a tool that helps you track caffeine timing relative to your sleep schedule.</p>
            <p>The average half-life of caffeine is about 5–6 hours, meaning that a cup of coffee at 4 PM could still affect your sleep at 10 PM.</p>
        </div>
    `,
    jetlag: `
        <h2 class="modal-title">Jet Lag Shift Planner</h2>
        <div class="modal-body">
            <p>This feature is currently in development. We're building a tool to help you plan light exposure to reduce jet lag symptoms.</p>
        </div>
    `,
    melatonin: `
        <h2 class="modal-title">Circadian Melatonin Quiz</h2>
        <div class="modal-body">
            <p>This feature is currently in development. A quiz to help you identify your chronotype is coming soon.</p>
        </div>
    `,
    adenosine: `
        <h2 class="modal-title">Adenosine Clearing</h2>
        <div class="modal-body">
            <p>This feature is currently in development. Learn more about how adenosine buildup affects your sleep drive.</p>
        </div>
    `,
    clinical: `
        <h2 class="modal-title">Clinical References</h2>
        <div class="modal-body">
            <p>This feature is currently in development. We're curating a list of peer-reviewed references for sleep science.</p>
        </div>
    `
};

function openModal(type) {
    const content = modalContent[type];
    if (content) {
        modalBody.innerHTML = content;
        modalOverlay.classList.add('open');
        modalOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ========================= Tools Loader (Dynamic Links) =========================
async function loadTools() {
    try {
        const response = await fetch('/assets/json/tools.json');
        if (!response.ok) throw new Error('Failed to fetch tools');
        const tools = await response.json();

        // Nav (desktop)
        const navContainer = document.getElementById('nav-tools');
        if (navContainer) {
            tools.forEach(tool => {
                const a = document.createElement('a');
                a.href = tool.url;
                a.textContent = tool.title;
                a.className = 'nav-link';
                navContainer.appendChild(a);
            });
        }

        // Mobile menu
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            tools.forEach(tool => {
                const a = document.createElement('a');
                a.href = tool.url;
                a.textContent = tool.title;
                mobileMenu.appendChild(a);
            });
        }

        // Footer
        const footerList = document.getElementById('footer-tools');
        if (footerList) {
            tools.forEach(tool => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = tool.url;
                a.textContent = tool.title;
                li.appendChild(a);
                footerList.appendChild(li);
            });
        }
    } catch (error) {
        console.error('Error loading tools:', error);
    }
}

// ========================= Initial Load =========================
document.addEventListener('DOMContentLoaded', () => {
    calculateCycles();
    loadTools();
});
