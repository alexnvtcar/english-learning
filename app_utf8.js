// ������� ���������� ����������
const activeTimeouts = new Set();

function safeSetTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
        activeTimeouts.delete(timeoutId);
        callback();
    }, delay);
    activeTimeouts.add(timeoutId);
    return timeoutId;
}

function clearAllTimeouts() {
    activeTimeouts.forEach(id => clearTimeout(id));
    activeTimeouts.clear();
}

// ��� DOM ���������
const DOM_CACHE = {
    taskList: null,
    currentLevel: null,
    totalXP: null,
    weeklyProgress: null,
    monthlyProgress: null,
    achievementsUnlocked: null,
    rewardsReceived: null,
    totalStarsSpent: null
};

function getCachedElement(id) {
    if (!DOM_CACHE[id]) {
        DOM_CACHE[id] = document.getElementById(id);
    }
    return DOM_CACHE[id];
}

function safeGetCachedElement(id) {
    const element = getCachedElement(id);
    if (!element) {
        console.warn(`Element with id "${id}" not found`);
    }
    return element;
}

function invalidateCache(id) {
    if (DOM_CACHE[id]) {
        DOM_CACHE[id] = null;
    }
}

// ��������� ������
function safeExecute(fn, context = 'Unknown') {
    try {
        return fn();
    } catch (error) {
        console.error(`Error in ${context}:`, error);
        showNotification('��������� ������. ���������� ��� ���.', 'error');
    }
}

// ��������� ������
function validateTaskData(task) {
    if (!task.name || task.name.trim().length === 0) {
        throw new Error('�������� ������� �� ����� ���� ������');
    }
    if (!task.xpReward || task.xpReward < 1) {
        throw new Error('XP ������� ������ ���� ������ 0');
    }
    if (!task.duration || task.duration < 1) {
        throw new Error('������������ ������ ���� ������ 0');
    }
    return true;
}

// Ensure default values are set for first run
function ensureDefaultValues() {
    console.log('?? ��������� � ������������� �������� �� ���������...');
    
    // �������������� tasks ���� �� ����������
    if (!appState.tasks || !Array.isArray(appState.tasks)) {
        appState.tasks = [];
        console.log('?? tasks ��������������� ��� ������ ������');
    }
    
    // �������������� rewards ���� �� ����������
    if (!appState.rewards || !Array.isArray(appState.rewards)) {
        appState.rewards = [];
        console.log('?? rewards ��������������� ��� ������ ������');
    }
    
    // �������������� activityData ���� �� ����������
    if (!appState.activityData || typeof appState.activityData !== 'object') {
        appState.activityData = {};
        console.log('?? activityData ��������������� ��� ������ ������');
    }
    
    // �������������� rewardPlan ���� �� ����������
    if (!appState.rewardPlan || typeof appState.rewardPlan !== 'object') {
        appState.rewardPlan = { description: '' };
        console.log('?? rewardPlan ��������������� ��� ������ ������');
    }
    
    // �������������� resetDate ���� �� ����������
    if (!appState.resetDate || typeof appState.resetDate.getFullYear !== 'function') {
        appState.resetDate = new Date();
        console.log('?? resetDate ��������������� ��� ������� ����');
    }
    
    // �������������� currentMonth ���� �� ����������
    if (!appState.currentMonth || typeof appState.currentMonth.getFullYear !== 'function') {
        appState.currentMonth = new Date();
        console.log('?? currentMonth ��������������� ��� ������� ����');
    }
    
    // �������������� selectedDate ���� �� ����������
    if (!appState.selectedDate || typeof appState.selectedDate.getFullYear !== 'function') {
        appState.selectedDate = new Date();
        console.log('?? selectedDate ��������������� ��� ������� ����');
    }
    
    // �������������� progress ���� �� ����������
    if (!appState.progress || typeof appState.progress !== 'object') {
        appState.progress = {
            level: 1,
            totalXP: 0,
            currentLevelXP: 0,
            bestWeekXP: 0,
            weeklyXP: 0,
            weeklyStars: 0,
            starBank: 0,
            weekStartKey: null
        };
        console.log('?? progress ��������������� �� ���������� �� ���������');
    }
    
    // �������������� role ���� �� ����������
    if (!appState.role) {
        appState.role = 'viewer';
        console.log('?? role ��������������� ��� viewer');
    }
    
    // �������������� userName ���� �� ����������
    if (!appState.userName) {
        appState.userName = '������';
        console.log('?? userName ��������������� ��� ������');
    }
    
    // �������������� pinCodes ���� �� ����������
    if (!appState.pinCodes || typeof appState.pinCodes !== 'object') {
        appState.pinCodes = {};
        console.log('?? pinCodes ��������������� ��� ������ ������');
    }
    
    console.log('? ��� �������� �� ��������� �����������');
}

// ���������� ���������� UI
function safeUpdateUI() {
    if (document.readyState === 'complete') {
        try {
            // ����������, ��� ��� �������� ���������������� ����� ����������� UI
            ensureDefaultValues();
            
            updateProgressDisplay();
            renderTasks();
            renderRewards();
            generateCalendar();
            updateDayActivity();
            renderWeeklyChart();
        } catch (error) {
            console.error('������ ��� ���������� UI:', error);
            // ��� ������ �������� ���������������� �������� �� ���������
            ensureDefaultValues();
        }
    } else {
        // ���� DOM �� �����, ���� ��� ����������
        document.addEventListener('DOMContentLoaded', () => {
            safeUpdateUI();
        });
    }
}

// Available icons for tasks (replaced Font Awesome with emojis)
const availableIcons = [
    { class: "??", name: "�����" },
    { class: "??", name: "��������" },
    { class: "??", name: "��������" },
    { class: "??", name: "��������" },
    { class: "???", name: "����" },
    { class: "??", name: "����" },
    { class: "??", name: "��������" },
    { class: "?", name: "������" },
    { class: "??", name: "������" },
    { class: "??", name: "������" },
    { class: "??", name: "�����" },
    { class: "??", name: "������" },
    { class: "??", name: "������" },
    { class: "?????", name: "�������" },
    { class: "???", name: "����" },
    { class: "?", name: "��������" },
    { class: "?", name: "����" },
    { class: "??", name: "����" },
    { class: "??", name: "������" },
    { class: "??", name: "����" }
];

// Application State
let appState = {
    user: {
        id: "user",
        username: "user",
    },
    role: 'viewer',
    userName: '������',
    pinCodes: {}, // PIN-���� ����������� ������ �� Firebase
    isVerified: false,
    progress: {
        level: 1,
        totalXP: 0,
        currentLevelXP: 0,
        bestWeekXP: 0,
        weeklyXP: 0,
        weeklyStars: 0,
        starBank: 0,
        weekStartKey: null,
    },

    tasks: [
        {
            id: 1,
            name: "�������� ����� ����",
            description: "������� 10 ����� ���������� ����",
            xpReward: 50,
            duration: 15,
            icon: "??",
            category: "vocabulary",
        },
        {
            id: 2,
            name: "�������������� ����������",
            description: "��������� ���������� �� Present Simple",
            xpReward: 75,
            duration: 20,
            icon: "??",
            category: "grammar",
        },
        {
            id: 3,
            name: "�����������",
            description: "���������� ������ � �������� �� �������",
            xpReward: 60,
            duration: 25,
            icon: "??",
            category: "listening",
        },
    ],
    rewards: [],
    currentMonth: new Date(),
    selectedDate: new Date(),
    activityData: {},
    rewardPlan: { description: "" },
    resetDate: new Date(),
    progressView: { weekOffset: 0, monthOffset: 0 },
    isInitializing: true, // ���� ��� ������������ �������������
    
    // ��������� �������
    backupSettings: {
        autoBackup: true,
        backupFrequency: 'daily', // daily, weekly, monthly
        maxBackups: 7, // ���������� �������� �������
        lastBackup: null,
        nextBackup: null,
        backupTypes: {
            scheduled: true,
            manual: true
        }
    }
};

function getEffectiveState() {
    return appState;
}

// Utility Functions
function formatDate(date) {
    // ���������, ��� date �������� �������� Date
    if (!date || typeof date.getFullYear !== 'function') {
        console.warn('?? formatDate: ������� �������� ������ date:', date);
        // ���������� ������� ���� ���� ���-�� ����� �� ���
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const d = String(now.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    
    // Local date string YYYY-MM-DD without UTC shift
    const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const y = local.getFullYear();
    const m = String(local.getMonth() + 1).padStart(2, '0');
    const d = String(local.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const STORAGE_KEY = 'english-learning-app-state-v1';
const IDEAS_KEY = 'english-learning-reward-ideas-v1';
// Save state locally only (no automatic Firebase saving)
function saveState() {
    // ���������, �� ���������� �� �������������
    if (appState.isInitializing) {
        console.log('?? ��������� ���������� ��������� �� ����� �������������');
        return false;
    }
    
    try {
        console.log('?? ��������� ��������� ��������...');
        console.log('?? PIN-���� �� ����������� � localStorage (������ � Firebase)');
        console.log('?? ��������� ����������� localStorage...');
        
        // ��������� ����������� localStorage
        if (typeof localStorage === 'undefined') {
            console.error('? localStorage ����������');
            return false;
        }
        
        // ��������� ������ � localStorage
        try {
            localStorage.setItem('test-save', 'test-save-value');
            const testValue = localStorage.getItem('test-save');
            if (testValue !== 'test-save-value') {
                console.error('? localStorage �������� ����������� ��� ������');
                return false;
            }
            localStorage.removeItem('test-save');
            console.log('? localStorage �������� ��������� ��� ������');
        } catch (testError) {
            console.error('? ������ ������������ ������ � localStorage:', testError);
            return false;
        }
        
        // �������������� ������ ��� ���������� (��� PIN-�����)
        const { pinCodes, ...dataToSave } = appState;
        
        console.log('?? ������ ��� ���������� (��� PIN-�����):', Object.keys(dataToSave));
        
        // ��������� ��������
        const jsonData = JSON.stringify(dataToSave);
        console.log('?? ������ JSON ������:', jsonData.length, '��������');
        
        localStorage.setItem(STORAGE_KEY, jsonData);
        
        // ���������, ��� ������ ������������� �����������
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) {
            console.error('? ������ �� ����������� � localStorage');
            return false;
        }
        
        // ��������� �������� ������������ ��������
        localStorage.setItem('current-user', appState.userName);
        
        console.log('? ��������� ��������� �������� (��� PIN-�����)');
        console.log('?? �������� ����������: ������ �������, ������:', savedData.length);
        
        return true;
    } catch (e) {
        console.error('? ������ ���������� ���������:', e);
        return false;
    }
}

// Load local state only (without Firebase)
function loadLocalState() {
    try {
        console.log('?? ��������� ��������� ���������...');
        console.log('?? ��������� ����������� localStorage...');
        
        // ��������� ����������� localStorage
        if (typeof localStorage === 'undefined') {
            console.error('? localStorage ����������');
            return;
        }
        
        // ��������� ������ � ������ � localStorage
        try {
            localStorage.setItem('test-storage', 'test-value');
            const testValue = localStorage.getItem('test-storage');
            if (testValue !== 'test-value') {
                console.error('? localStorage �������� �����������');
                return;
            }
            localStorage.removeItem('test-storage');
            console.log('? localStorage �������� ���������');
        } catch (testError) {
            console.error('? ������ ������������ localStorage:', testError);
            return;
        }
        
        // ��������� �� localStorage
        const raw = localStorage.getItem(STORAGE_KEY);
        console.log('?? ����� ������ �� localStorage:', raw ? '�������' : '�� �������');
        
        if (raw) {
            const saved = JSON.parse(raw);
            console.log('?? ������������ ������:', Object.keys(saved));
            
            // ��������������� ���� ������ �� localStorage
            const restoredSaved = restoreDataTypes(saved);
            
            // ��������� appState, �������� ������ ����
            // �� ��������� isVerified � pinCodes �� localStorage
            const { isVerified, pinCodes, ...restoredData } = restoredSaved;
            
            appState = { 
                ...appState, 
                ...restoredData,
                // ��������� �������� ������������
                userName: appState.userName || restoredData.userName || '������',
                // isVerified ������ false ��� �������
                isVerified: false,
                // PIN-���� �� ��������� �� localStorage - ������ �� Firebase
                pinCodes: {}
            };
            
            console.log('? ��������� ��������� ���������');
            console.log('?? PIN-���� �� ��������� �� localStorage (������ �� Firebase)');
            console.log('?? ������� ������������:', appState.userName);
        } else {
            console.log('?? ��������� ��������� �� �������, ���������� �������� �� ���������');
            // ��� ������ ������� �� ����� ���������� �������������� �������� �� ���������
            ensureDefaultValues();
        }
        
        // �������������� �������� ��� ����������� �����
        if (!appState.currentMonth || typeof appState.currentMonth.getFullYear !== 'function') {
            appState.currentMonth = new Date();
        }
        if (!appState.selectedDate || typeof appState.selectedDate.toLocaleDateString !== 'function') {
            appState.selectedDate = new Date();
        }
        
        // ������������ ������� bestWeekXP
        if (!appState.progress) {
            appState.progress = {};
        }
        if (typeof appState.progress.bestWeekXP === 'undefined') {
            appState.progress.bestWeekXP = 0;
            console.log('?? bestWeekXP ��������������� � loadLocalState');
        }
        
        console.log('?? ��������� ��������� ���������, ������������� ��� ����������...');
        
        // ������ �������� ���� ����������� ����� �������� ���������� ���������
        
        // 1. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ���������, ��� ��� ���������� ���������
        console.log('? ��������� ��������� ���������, ��� ���������� �����������');
        
        // �������������� ���������� ��������� ��� ��������
        // saveDataToFirebase();
        
    } catch (e) {
        console.error('? ������ �������� ���������� ���������:', e);
        // ������������� �������� �� ��������� ��� ������
        appState.currentMonth = new Date();
        appState.selectedDate = new Date();
        
        console.log('?? ������������� �������� �� ���������, ������������� ��� ����������...');
        
        // ������ �������� ���� ����������� ��� ������
        
        // 1. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ���������, ��� ��� ���������� ���������
        console.log('? �������� �� ��������� �����������, ��� ���������� �����������');
        
        // �������������� ���������� ��������� ��� ��������� �������� �� ���������
        // saveDataToFirebase();
    }
}

// Load state from Firebase (for sync)
async function loadStateFromFirestore() {
    if (!isFirebaseAvailable()) {
        console.log('Firebase ����������, ��������� ������ ��������');
        return false;
    }

    try {
        console.log('?? �������� �������� �� Firebase...');
        
        // ������� ������� ��������� ����� ������
        let firestoreData = null;
        let dataSource = 'shared-data';
        
        try {
            const sharedRef = doc(db, 'shared-data', 'main');
            const sharedSnap = await retryOperation(async () => {
                return await getDoc(sharedRef);
            }, 3, 1000);
            
            if (sharedSnap.exists()) {
                firestoreData = sharedSnap.data();
                console.log('?? ����� ������ ������� � Firebase');
            } else {
                // ���� ����� ������ ���, ������� ��������� ������ ������������
                const userRef = doc(db, 'users', appState.userName);
                const userSnap = await retryOperation(async () => {
                    return await getDoc(userRef);
                }, 3, 1000);
                
                if (userSnap.exists()) {
                    firestoreData = userSnap.data();
                    dataSource = 'user-data';
                    console.log('?? ������ ������������ ������� � Firebase');
                } else {
                    console.log('?? ������ �� ������� � Firebase');
                    return false;
                }
            }
        } catch (error) {
            console.error('? ������ ��� �������� ������ ����� ���� �������:', error);
            return false;
        }
        
        if (firestoreData) {
            console.log('?? ������ ��������� �� Firebase:', {
                source: dataSource,
                lastUpdated: firestoreData.lastUpdated,
                lastSavedBy: firestoreData.lastSavedBy,
                version: firestoreData.version,
                totalSaves: firestoreData.saveStats?.totalSaves || 0
            });
            
            // ��������������� ���� ������
            const restoredData = restoreDataTypes(firestoreData);
            
            // ��������� ������ ��������� ���������
            const localSettings = {
                userName: appState.userName,
                role: appState.role,
                isVerified: appState.isVerified,
                pinCodes: appState.pinCodes // ��������� PIN-���� ��������
            };
            
            // ��������� ��������� �������, ���� ��� ���� � ����������� ������
            if (restoredData.backupSettings) {
                console.log('?? ��������� ��������� ������� �� Firebase:', restoredData.backupSettings);
                localSettings.backupSettings = restoredData.backupSettings;
            }
            
            // ��������� ��������� ���������
            appState = { ...appState, ...restoredData, ...localSettings };
            
            // ��������� UI ���������
            safeUpdateUI();
            
            console.log('? ������ ������� ��������� �� Firebase');
            // ����������� � �������� ������������ ������ ��� �������������
            
            // ���������� ��������� ���������� � ��������
            showLoadDetails(firestoreData);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('? ������ �������� �� Firebase:', error);
        
        // ��������� ��� ������
        if (error.message && error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
            console.warn('?? ������ ������������ �������� (��������, ����������� �������)');
            showNotification('Firebase ������������ ������������� �������', 'warning');
        } else if (error.code === 'permission-denied') {
            console.warn('?? �������� � ������� � Firestore');
            showNotification('�������� � ������� � Firestore', 'error');
        } else if (error.code === 'unavailable') {
            console.warn('?? Firestore ����������');
            showNotification('Firestore ����������', 'error');
        } else if (error.code === 'not-found') {
            console.warn('?? �������� �� ������ � Firestore');
            showNotification('������ �� ������� � Firebase', 'info');
        } else {
            showNotification('������ �������� �� Firebase', 'error');
        }
        
        return false;
    }
}

function applyRolePermissions() {
    const isViewer = appState.role === 'viewer';
    const isMikhail = appState.userName === '������';
    
    // ��������� ������ ������� ������ ��� ��-������� (�� ��������� ���������� ������)
    const rewardControls = [
        'button[onclick^="showRewardModal"]',
        'button[onclick^="showIdeaModal"]',
    ];
    rewardControls.forEach(sel => document.querySelectorAll(sel).forEach(el => {
        if (el && el.closest) {
            // ��������� �������� ������ ������ ��� �������������, ������� �� ������
            if (!isMikhail && !el.closest('#accountModal') && !el.closest('.progress-container')) {
                el.setAttribute('disabled', 'true');
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.6';
            } else {
                el.removeAttribute('disabled');
                el.style.pointerEvents = '';
                el.style.opacity = '';
            }
        }
    }));
    
    // ��� ������ ��������� ������ ���������� ���������� ��������� � ����������
    const adminControls = [
        '.btn-icon-delete', '.activity-delete',
        'button[onclick^="showTaskModal"]',
        '#settingsMenu .settings-item.danger',
        '#importFile',
    ];
    adminControls.forEach(sel => document.querySelectorAll(sel).forEach(el => {
        if (el && el.closest) {
            // ��������� �������� ������ ��� viewer (������), �� �� ��� ������
            if (isViewer && !el.closest('#accountModal') && !el.closest('.progress-container')) {
                el.setAttribute('disabled', 'true');
                el.style.pointerEvents = 'none';
                el.style.opacity = '0.6';
            } else {
                el.removeAttribute('disabled');
                el.style.pointerEvents = '';
                el.style.opacity = '';
            }
        }
    }));
    
    // ������������� ��������� ������ �������� ������� ��� �������
    const taskDeleteButtons = document.querySelectorAll('.btn-icon-delete');
    taskDeleteButtons.forEach(btn => {
        if (btn && btn.closest('.task-item')) {
            if (isViewer) {
                btn.style.display = 'none'; // �������� ������ �������� ��� �������
            } else {
                btn.style.display = ''; // ���������� ��� ������
            }
        }
    });
    
    // Special case: allow progress navigation for viewer
    const progressNav = document.querySelectorAll('#weekPrevBtn, #weekNextBtn');
    progressNav.forEach(el => {
        if (el && isViewer) {
            el.removeAttribute('disabled');
            el.style.pointerEvents = '';
            el.style.opacity = '';
        }
    });
    
    // ���������� ���������� ������ ��������
    const blocksToHide = [
        { element: document.getElementById('techDiagnosticsBlock'), divider: document.getElementById('dividerBeforeTech') },
        { element: document.getElementById('firebaseOperationsBlock'), divider: document.getElementById('dividerBeforeFirebase') },
        { element: document.getElementById('dangerousOperationsBlock'), divider: document.getElementById('dividerBeforeDanger') },
        { element: document.getElementById('backupManagementBlock'), divider: document.getElementById('dividerBeforeBackups') }
    ];
    
    blocksToHide.forEach(({ element, divider }) => {
        if (element) {
            if (isViewer) {
                // �������� ����� ��� ������� (viewer)
                element.style.display = 'none';
            } else {
                // ���������� ����� ��� ������
                element.style.display = '';
            }
        }
        
        if (divider) {
            if (isViewer) {
                // �������� ����������� ��� ������� (viewer)
                divider.style.display = 'none';
            } else {
                // ���������� ����������� ��� ������
                divider.style.display = '';
            }
        }
    });
    
    // ��������������� ��������� ������ (��� �������� �� ���������)
    restoreSettingsBlocksState();
    
    // ��������� ����������� ������� � ������ ����
    renderTasks();
}

function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    const messageEl = document.getElementById(
        "notificationMessage",
    );

    messageEl.textContent = message;
    notification.className = `notification ${type} show`;

    safeSetTimeout(() => {
        notification.classList.remove("show");
    }, 3000);
}









// Welcome modal texts (random unique praise each time)
const welcomePhrases = [
    "Fantastic start, {name}! Every click is a step toward fluency�keep shining!",
    "{name}, your consistency is impressive�today's effort will compound into greatness!",
    "Brilliant move, {name}! Your dedication to English is what champions are made of.",
    "{name}, you're unstoppable! Each lesson sharpens your mind and your voice.",
    "Outstanding, {name}! You're building a skill that will open doors everywhere.",
    "Great energy, {name}! Turning intention into action�this is how mastery begins.",
    "{name}, amazing focus! Your future self will thank you for this exact moment.",
    "Superb, {name}! Small wins daily create extraordinary results�let's go!",
    "You rock, {name}! Today's practice brings you closer to confident English.",
    "Impressive, {name}! Momentum is yours�one task at a time to the top!"
];

function showWelcomeModal() {
    // �������� ������� ��������� (������� ����-�����)
    const currentState = getEffectiveState();
    
    // ���������� ����������� ������ ��� �������
    if (currentState.userName !== '������') {
        return;
    }
    
    const idx = Math.floor(Math.random() * welcomePhrases.length);
    const msg = welcomePhrases[idx].replace('{name}', currentState.userName || '������');
    
    // ��������� ��������� ���������� ����
    const welcomeTitle = document.getElementById('welcomeModalTitle');
    if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome, ${currentState.userName}!`;
    }
    
    const welcomeEl = document.getElementById('welcomeMessage');
    if (welcomeEl) welcomeEl.textContent = msg;
    
    console.log('?? ���������� �����������, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ����� ������� �����������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ����������� ��������, ��� ���������� �����������');
    
    // �������������� ���������� ��������� ��� ������ �����������
    // saveDataToFirebase();
    
    document.getElementById('welcomeModal').classList.add('show');
}
function hideWelcomeModal() {
    document.getElementById('welcomeModal').classList.remove('show');
}

function loadIdeas() {
    try {
        const raw = localStorage.getItem(IDEAS_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    } catch { return []; }
}
function saveIdeas(list) {
    try { localStorage.setItem(IDEAS_KEY, JSON.stringify(list.slice(0, 50))); } catch {}
}
function addIdea(desc) {
    const ideas = loadIdeas();
    const clean = desc.trim();
    if (!clean) return;
    if (!ideas.includes(clean)) {
        ideas.unshift(clean);
        saveIdeas(ideas);
    }
}
function removeIdea(desc) {
    const ideas = loadIdeas().filter(i => i !== desc);
    saveIdeas(ideas);
}
function renderIdeaSuggestions(query = '') {
    const box = document.getElementById('ideaAutocomplete');
    if (!box) return;
    const ideas = loadIdeas();
    const q = query.trim().toLowerCase();
    const filtered = q ? ideas.filter(i => i.toLowerCase().includes(q)) : ideas;
    if (filtered.length === 0) { box.style.display = 'none'; box.innerHTML = ''; return; }
    box.innerHTML = filtered.map(i => `
        <div class="autocomplete-item" data-value="${escapeHTML(i)}">
            <div class="autocomplete-text">${escapeHTML(i)}</div>
            <button class="autocomplete-remove" aria-label="������� ����������� �������" data-remove="${escapeHTML(i)}">
                ?
            </button>
        </div>
    `).join('');
    box.style.display = 'block';
}

function getXPRequiredForLevel(level) {
    if (level >= 100) return 0;
    // ������� ���������: �� ���������� ������ ������ ����������� 810 XP
    return 810;
}

function calculateXPProgress(currentXP, maxXP) {
    if (!maxXP || maxXP <= 0) return 100;
    return Math.min((currentXP / maxXP) * 100, 100);
}

function calculateWeeklyStars(weeklyXP) {
    const thresholds = [500, 750];
    const stars = thresholds.filter((threshold) => weeklyXP >= threshold).length;
    console.log('? calculateWeeklyStars:', { weeklyXP, thresholds, stars });
    return stars;
}

// Function to get next weekly target (fixed at 750 XP)
function getNextWeeklyTarget() {
    return 750;
}

// Function to get weekly progress percentage (based on 750 XP max)
function getWeeklyProgressPercent(weeklyXP = null) {
    const currentXP = weeklyXP !== null ? weeklyXP : appState.progress.weeklyXP;
    return Math.min(100, (currentXP / 750) * 100);
}

// Function to get weekly progress stage
function getWeeklyProgressStage(currentXP) {
    if (currentXP < 500) {
        return 'beginner'; // 0-499 XP
    } else if (currentXP < 750) {
        return 'intermediate'; // 500-749 XP
    } else {
        return 'expert'; // 750+ XP
    }
}

// DOM Updates
function updateProgressDisplay() {
    const { progress } = appState;

    const currentLevelEl = safeGetCachedElement("currentLevel");
    const totalXPEl = safeGetCachedElement("totalXP");
    
    if (currentLevelEl) currentLevelEl.textContent = progress.level;
    if (totalXPEl) totalXPEl.textContent = progress.totalXP.toLocaleString();
    updateBestWeekDisplay();

    const xpNeeded = getXPRequiredForLevel(progress.level);
    const xpRemaining = Math.max(0, xpNeeded - progress.currentLevelXP);
    const levelProgress = calculateXPProgress(progress.currentLevelXP, xpNeeded);
    document.getElementById("levelProgress").style.width = `${levelProgress}%`;
    document.getElementById("xpProgress").textContent = xpNeeded === 0 ? '������������ �������' : `${xpRemaining} XP`;

    // Update star bank and earned stars for the current week
    updateWeeklyStars();
    // Weekly and monthly sections
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateRedeemControls();
    
    // ������������� � ��������� ����������� ������ ������
    recalculateBestWeek();
    
    // ��������� ����������� ������� ��������
    updateLearningTimeDisplay();
}

function isWeekday(date) {
    const d = new Date(date);
    const day = d.getDay();
    return day >= 1 && day <= 5; // Mon..Fri
}

function hasActivityOn(date, stateOverride) {
    const state = stateOverride || appState;
    const key = formatDate(new Date(date));
    const logs = (state.activityData && state.activityData[key]);
    return Array.isArray(logs) && logs.length > 0;
}

function iterateDays(startDate, endDate, cb) {
    const cur = new Date(startDate);
    cur.setHours(0,0,0,0);
    const stop = new Date(endDate);
    stop.setHours(0,0,0,0);
    while (cur <= stop) {
        cb(new Date(cur));
        cur.setDate(cur.getDate() + 1);
    }
}

function updateBestWeekDisplay() {
    const bestWeekXP = appState.progress.bestWeekXP || 0;
    const el = document.getElementById('bestWeekXP');
    if (el) el.textContent = `${bestWeekXP} XP`;
    
    console.log('?? �������� ������� ������ ������:', bestWeekXP, 'XP');
}

function updateWeeklyStars() {
    const stars = document.querySelectorAll("#weeklyStars .star");
    const newEarned = calculateWeeklyStars(appState.progress.weeklyXP);
    const oldEarned = appState.progress.weeklyStars || 0;
    const oldStarBank = appState.progress.starBank || 0;
    
    // ��������� ������ �������� weeklyStars ����� �����������
    const previousWeeklyStars = oldEarned;
    
    // ���������� ���������� ���������: newEarned vs previousWeeklyStars
    const starsGained = newEarned - previousWeeklyStars;
    const nextStarThreshold = newEarned < 2 ? (newEarned === 0 ? 500 : 750) : null;
    
    console.log('? updateWeeklyStars called:', {
        weeklyXP: appState.progress.weeklyXP,
        previousWeeklyStars,
        newEarned,
        starsGained,
        oldStarBank,
        nextStarThreshold: nextStarThreshold ? `${nextStarThreshold} XP` : '�������� ���������'
    });
    

    
    if (newEarned > previousWeeklyStars) {
        appState.progress.starBank = (appState.progress.starBank || 0) + starsGained;
        
        console.log('? ������ ��������! ���������� �����������:', {
            starsGained,
            newEarned,
            weeklyXP: appState.progress.weeklyXP,
            newStarBank: appState.progress.starBank
        });
        // Star notifications and achievement checks removed
    } else {
        console.log('? ������ �� ��������. �������:', {
            newEarned,
            previousWeeklyStars,
            condition: newEarned > previousWeeklyStars,
            weeklyXP: appState.progress.weeklyXP
        });
    }
    
    appState.progress.weeklyStars = newEarned;

    stars.forEach((star, index) => {
        if (index < newEarned) star.classList.add("filled");
        else star.classList.remove("filled");
    });

    const availableStarsEl = document.getElementById("availableStars");
    if (availableStarsEl) {
        availableStarsEl.textContent = `${appState.progress.starBank || 0} ?`;
    }
    // inline available star bank
    const availableInline = document.getElementById('availableStarsInline');
    if (availableInline) availableInline.textContent = `${appState.progress.starBank || 0} ?`;
    // redeem stars (3) based on this week's earned stars
    const redeemStars = document.querySelectorAll('#redeemStars .redeem-star');
    redeemStars.forEach((el, idx) => {
        if (idx < newEarned) el.classList.add('filled'); else el.classList.remove('filled');
        if (newEarned >= 2 && idx === 2) el.classList.add('ready'); else el.classList.remove('ready');
    });
}

// Learning Time Functions
function updateLearningTimeDisplay() {
    const timeData = calculateLearningTimeData();
    
    // ���������� ����������
    console.log('?? ������ ������� ��������:');
    console.log('   - ����� ����� �� ��� �����:', timeData.totalTime, '����� =', formatTime(timeData.totalTime));
    console.log('   - ������� � ������ (����� ������� �� ����):', timeData.weeklyAverage, '����� =', formatTime(timeData.weeklyAverage));
    console.log('   - ������� � ����:', timeData.dailyAverage, '����� =', formatTime(timeData.dailyAverage));
    console.log('   - ������� ����� �� ���� ������:', timeData.weeklyTime.map(t => formatTime(t)));
    
    // ��������� �������� ����������
    document.getElementById('totalLearningTime').textContent = formatTime(timeData.totalTime);
    document.getElementById('weeklyAvgTime').textContent = formatTime(timeData.weeklyAverage);
    document.getElementById('dailyAvgTime').textContent = formatTime(timeData.dailyAverage);
    
    // ��������� �������� ���������
    updateWeeklyTimeChart(timeData.weeklyTime);
    

    
    // ��������� �������
    updateTimeLegend(timeData.weeklyTime);
}

// ���������� ��������� ������� ���� ��� ������������
function handleResize() {
    // �������������� �������� ��������� ��� ��������� �������
    const timeData = calculateLearningTimeData();
    updateWeeklyTimeChart(timeData.weeklyTime);
}

function calculateLearningTimeData() {
    const state = getEffectiveState();
    const activity = state.activityData || {};
    const dates = Object.keys(activity).sort();
    
    let totalTime = 0;
    let dailyTime = {};
    let weeklyTimeTotal = [0, 0, 0, 0, 0, 0, 0]; // ����� ����� �� ���� ������ (��-��)
    let weeklyTimeCounts = [0, 0, 0, 0, 0, 0, 0]; // ���������� ���� �� ���� ������ ��� �������� ��������
    
    // ��������� ����� ��� ������� ��� �� ������ ������������ ������
    dates.forEach(date => {
        const logs = activity[date] || [];
        let dayTime = 0;
        
        // ���� � ��� ���� timeSpent, ���������� ���, ����� ���� ������� �� ID ��� ��������� �������� ������������
        logs.forEach(log => {
            if (log.timeSpent) {
                dayTime += log.timeSpent;
            } else {
                // ������� ������� �� ID ��� ��������� �������� ������������
                const task = appState.tasks.find(t => t.id === log.taskId);
                let estimatedTime = 0;
                
                if (task && task.duration) {
                    // ���������� �������� ������������ �� �������
                    estimatedTime = task.duration;
                } else {
                    // ���� ������� �� �������, ���������� ������� ��������
                    if (log.taskName && log.taskName.includes('��������������')) {
                        estimatedTime = 20; // ������� �������� ��� ����������
                    } else if (log.taskName && log.taskName.includes('�����������')) {
                        estimatedTime = 25; // ������� �������� ��� �����������
                    } else {
                        estimatedTime = 15; // ������� �������� ��� �������� ����
                    }
                }
                
                dayTime += estimatedTime;
                
                // ��������� ����������� ����� ��� �������� �������������
                log.timeSpent = estimatedTime;
            }
        });
        
        if (dayTime > 0) {
            dailyTime[date] = dayTime;
            totalTime += dayTime;
            
            // ��������� � ���������� �� ���� ������ ��� ������� ��������
            const d = new Date(date);
            const dayOfWeek = d.getDay();
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // �� = 0, �� = 6
            weeklyTimeTotal[adjustedDay] += dayTime;
            weeklyTimeCounts[adjustedDay]++;
        }
    });
    
    // ��������� ������� ����� �� ���� ������ (�� ���������!)
    const weeklyTimeAverage = weeklyTimeTotal.map((total, index) => {
        return weeklyTimeCounts[index] > 0 ? total / weeklyTimeCounts[index] : 0;
    });
    
    // ��������� ������� ����� � ����
    const activeDays = dates.filter(date => dailyTime[date] > 0).length;
    const dailyAverage = activeDays > 0 ? totalTime / activeDays : 0;
    
    // ��������� ������� ����� � ������ (����� �������� ������� �� ���� ���� ������)
    const weeklyAverage = weeklyTimeAverage.reduce((sum, time) => sum + time, 0);
    
    return {
        totalTime,
        dailyAverage,
        weeklyAverage,
        dailyTime,
        weeklyTime: weeklyTimeAverage // ���������� ������� ����� �� ���� ������
    };
}



function formatTime(minutes) {
    if (!minutes || minutes === 0) return '0 � 0 ���';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    // ���� ���� ����, ���������� � ����, � ������
    if (hours > 0) {
        if (mins > 0) {
            return `${hours} � ${mins} ���`;
        } else {
            return `${hours} �`;
        }
    } else {
        // ���� ��� �����, ���������� ������ ������
        return `${mins} ���`;
    }
}

function updateWeeklyTimeChart(weeklyTime) {
    // weeklyTime ������ �������� ������� ����� �� ���� ������
    const totalAverageWeeklyTime = weeklyTime.reduce((sum, time) => sum + time, 0);
    
    // ����������� ����� � ������� HH:MM
    const timeDisplay = formatTime(totalAverageWeeklyTime);
    
    // ���������� ����� � ����������� �� ������� ������
    const isMobile = window.innerWidth <= 480;
    const isTablet = window.innerWidth <= 768;
    
    let labelText = "� ������";
    if (isMobile) {
        labelText = "� ������";
    } else if (isTablet) {
        labelText = "� ������";
    }
    
    document.getElementById('weeklyTimeChart').innerHTML = `
        <div class="time-chart-center">
            <div class="time-chart-total">${timeDisplay}</div>
            <div class="time-chart-label">${labelText}</div>
        </div>
    `;
    
    // ��������� conic-gradient ��� ���������
    const chart = document.getElementById('weeklyTimeChart');
    
    if (totalAverageWeeklyTime > 0) {
        let currentAngle = 0;
        const gradients = [];
        const colors = ['#1e40af', '#3b82f6', '#059669', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        weeklyTime.forEach((time, index) => {
            if (time > 0) {
                const angle = (time / totalAverageWeeklyTime) * 360;
                gradients.push(`${colors[index]} ${currentAngle}deg ${currentAngle + angle}deg`);
                currentAngle += angle;
            }
        });
        
        if (gradients.length > 0) {
            chart.style.background = `conic-gradient(from 0deg, ${gradients.join(', ')})`;
        } else {
            // ���� ��� ������, ���������� ������� ��������
            chart.style.background = 'conic-gradient(from 0deg, #e2e8f0 0deg 360deg)';
        }
    } else {
        // ���� ��� ������, ���������� ������� ��������
        chart.style.background = 'conic-gradient(from 0deg, #e2e8f0 0deg 360deg)';
    }
}



function updateTimeLegend(weeklyTime) {
    const legend = document.getElementById('weeklyTimeLegend');
    const days = ['��', '��', '��', '��', '��', '��', '��'];
    const colors = ['#1e40af', '#3b82f6', '#059669', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    let legendHTML = '';
    let totalAverageWeeklyTime = weeklyTime.reduce((sum, time) => sum + time, 0);
    
    weeklyTime.forEach((time, index) => {
        if (time > 0) {
            const percentage = totalAverageWeeklyTime > 0 ? ((time / totalAverageWeeklyTime) * 100).toFixed(1) : 0;
            legendHTML += `
                <div class="time-legend-item">
                    <div class="time-legend-color" style="background-color: ${colors[index]};"></div>
                    <span>${days[index]}: ${formatTime(time)}</span>
                    <span style="color: #94a3b8; font-size: 0.75rem;">(${percentage}%)</span>
                </div>
            `;
        } else {
            legendHTML += `
                <div class="time-legend-item" style="opacity: 0.5;">
                    <div class="time-legend-color" style="background-color: #e2e8f0;"></div>
                    <span>${days[index]}: ��� ������</span>
                </div>
            `;
        }
    });
    

    
    legend.innerHTML = legendHTML;
}

function getWeekStartKey(date) {
    // ���������, ��� date �������� �������� Date
    if (!date || typeof date.getDay !== 'function') {
        console.warn('?? getWeekStartKey: ������� �������� ������ date:', date);
        date = new Date();
    }
    
    const d = new Date(date);
    const day = (d.getDay() + 6) % 7;
    d.setHours(0,0,0,0);
    d.setDate(d.getDate() - day);
    return formatDate(d);
}

function ensureWeeklyReset() {
    // ���������, ��� appState.progress ����������
    if (!appState.progress) {
        appState.progress = {
            weekStartKey: '',
            weeklyXP: 0,
            weeklyStars: 0,
            starBank: 0,
            bestWeekXP: 0
        };
    }
    
    const currentKey = getWeekStartKey(new Date());
    if (appState.progress.weekStartKey !== currentKey) {
        console.log('?? ����� ������, ��������� ������ ������...');
        
        // ��������� ������ ������ ����� �������
        updateBestWeekProgress();
        
        appState.progress.weekStartKey = currentKey;
        appState.progress.weeklyXP = 0;
        appState.progress.weeklyStars = 0;
        
        console.log('?? ������ ��������, ������������� ��� ����������...');
        
        // ������ �������� ���� ����������� ����� ������ ������
        
        // 1. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        updateProgressDisplay();
        updateBestWeekDisplay();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        
        // 3. ���������, ��� ��� ���������� ���������
        console.log('? ������ ��������, ��� ���������� �����������');
        console.log('?? ����� ������:', currentKey);
        
        // �������������� ���������� ��������� ��� ������ ������
        // saveDataToFirebase();
    }
}

function updateRedeemControls() {
    const redeemBtn = document.getElementById('redeemBtn');
    const canRedeem = (appState.progress.starBank || 0) >= 3 && appState.rewardPlan && appState.rewardPlan.description;
    if (redeemBtn) {
        redeemBtn.disabled = !canRedeem;
        redeemBtn.title = canRedeem ? '' : '����� 3 ? � ��������������� �������';
        // Ensure button is clickable for viewer role
        if (appState.role === 'viewer') {
            redeemBtn.style.pointerEvents = '';
            redeemBtn.style.opacity = '';
        }
    }
    const planned = document.getElementById('plannedRewardDisplay');
    if (planned) planned.textContent = appState.rewardPlan && appState.rewardPlan.description ? appState.rewardPlan.description : '�';
    const confirmBtn = document.getElementById('confirmRedeemBtn');
    if (confirmBtn) confirmBtn.disabled = !canRedeem;

    // Toggle idea button availability and planned card visibility
    const ideaBtn = document.getElementById('ideaBtn');
    const hasPlanned = !!(appState.rewardPlan && appState.rewardPlan.description);
    if (ideaBtn) {
        ideaBtn.disabled = hasPlanned;
        ideaBtn.title = hasPlanned ? '������� ��� �������������. �������� �, ����� ������������� �����.' : '��������� � ��������� �������';
    }
    const plannedCard = document.getElementById('plannedRewardCard');
    const plannedText = document.getElementById('plannedRewardText');
    if (plannedCard) plannedCard.style.display = hasPlanned ? 'block' : 'none';
    if (plannedText) plannedText.textContent = hasPlanned ? appState.rewardPlan.description : '�';

    // Bank stars visualization (global goal: 3 ? to redeem)
    const bank = Math.max(0, appState.progress.starBank || 0);
    const bankStars = [document.getElementById('bankStar1'), document.getElementById('bankStar2'), document.getElementById('bankStar3')];
    bankStars.forEach((el, idx) => { if (!el) return; if (idx < Math.min(3, bank)) el.classList.add('filled'); else el.classList.remove('filled'); if (bank >= 3) el.classList.add('ready'); else el.classList.remove('ready'); });
    const bankText = document.getElementById('bankStarsText');
    if (bankText) bankText.textContent = `${bank} ?`;
}

function renderWeeklyChart(weekStartOverride) {
    const container = document.getElementById('weeklyChart');
    if (!container) return;
    // Collect XP per day for selected week (Mon..Sun)
    const weekStart = weekStartOverride || getWeekStartFromOffset(appState.progressView?.weekOffset || 0);
    const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        return d;
    });
    const xpByDay = days.map(d => {
        const key = formatDate(d);
        const logs = appState.activityData[key] || [];
        return logs.reduce((s, l) => s + (l.xpEarned || 0), 0);
    });
    const maxXP = Math.max(100, ...xpByDay);
    const dayLabels = ['��','��','��','��','��','��','��'];
    container.innerHTML = days.map((d, idx) => {
        const val = xpByDay[idx];
        const h = Math.round((val / maxXP) * 100);
        return `
            <div class="bar" title="${dayLabels[idx]}: ${val} XP">
                <div class="bar-column" aria-label="${dayLabels[idx]} ${val} XP">
                    <div class="bar-value" style="height: ${h}%"></div>
                </div>
                <div class="bar-xp">${val}</div>
                <div class="bar-label">${dayLabels[idx]}</div>
            </div>
        `;
    }).join('');
}

function getWeekStartFromOffset(offset) {
    const base = new Date();
    const day = (base.getDay() + 6) % 7; // 0=Mon
    base.setHours(0,0,0,0);
    base.setDate(base.getDate() - day + (offset * 7));
    return base;
}

// Function to get week start for a specific date
function getWeekStartForDate(date) {
    const weekStart = new Date(date);
    const day = (weekStart.getDay() + 6) % 7; // 0=Mon
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - day);
    return weekStart;
}

function formatWeekRangeLabel(weekStart) {
    const end = new Date(weekStart);
    end.setDate(end.getDate() + 6);
    const fmt = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    const y = weekStart.getFullYear() === end.getFullYear() ? '' : ` ${end.getFullYear()}`;
    return `${fmt(weekStart)} � ${fmt(end)}${y}`;
}

function computeWeekXP(weekStart) {
    let total = 0;
    for (let i=0;i<7;i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate()+i);
        const key = formatDate(d);
        const logs = appState.activityData[key] || [];
        total += logs.reduce((s,l)=>s+(l.xpEarned||0),0);
    }
    return total;
}

function updateProgressWeekSection() {
    const offset = appState.progressView?.weekOffset || 0;
    const start = getWeekStartFromOffset(offset);
    const label = document.getElementById('weekRangeLabel');
    if (label) label.textContent = formatWeekRangeLabel(start);
    const weekXP = computeWeekXP(start);
    
    // ���������� ������ �������� ���������� ��������� (�������� 750 XP)
    const weeklyProgressPct = Math.min(100, (weekXP / 750) * 100);
    
    const weeklyBar = document.getElementById('weeklyBar');
    if (weeklyBar) weeklyBar.style.width = `${weeklyProgressPct}%`;
    const weeklyText = document.getElementById('weeklyProgress');
    if (weeklyText) weeklyText.textContent = `${weekXP} / 750 XP`;
    
    // Update threshold markers
    const m500 = document.getElementById('marker500');
    const m750 = document.getElementById('marker750');
    if (m500) m500.classList.toggle('active', weekXP >= 500);
    if (m750) m750.classList.toggle('active', weekXP >= 750);
    updateWeeklyStarsDisplayForXP(weekXP);
    renderWeeklyChart(start);
    updateWeekNavControls();
    
    console.log('?? ��������� �������� ��������:', {
        weekOffset: offset,
        weekStart: start.toISOString().split('T')[0],
        weekXP: weekXP,
        progressPercent: weeklyProgressPct
    });
}

function updateWeekNavControls() {
    const nextBtn = document.getElementById('weekNextBtn');
    if (nextBtn) nextBtn.disabled = (appState.progressView?.weekOffset || 0) >= 0;
}

function changeWeek(direction) {
    const newOffset = (appState.progressView?.weekOffset || 0) + direction;
    if (newOffset > 0) return; // prevent going to future
    appState.progressView.weekOffset = newOffset;
    updateProgressWeekSection();
    // �������������� ���������� ���������
}

function changeMonthProgress(direction) {
    const newOffset = (appState.progressView?.monthOffset || 0) + direction;
    if (newOffset > 0) return; // prevent going to future
    appState.progressView.monthOffset = newOffset;
    updateMonthlyProgressSection();
    updateMonthNavControls();
    // �������������� ���������� ���������
}

function updateMonthNavControls() {
    const nextBtn = document.getElementById('monthNextBtn');
    if (nextBtn) nextBtn.disabled = (appState.progressView?.monthOffset || 0) >= 0;
}

function updateWeeklyStarsDisplayForXP(weeklyXP) {
    const stars = document.querySelectorAll('#weeklyStars .star');
    const count = calculateWeeklyStars(weeklyXP);
    stars.forEach((star, index) => {
        if (index < count) star.classList.add('filled'); else star.classList.remove('filled');
    });
    const redeemStars = document.querySelectorAll('#redeemStars .redeem-star');
    redeemStars.forEach((el, idx) => {
        if (idx < count) el.classList.add('filled'); else el.classList.remove('filled');
        if (count >= 2 && idx === 2) el.classList.add('ready'); else el.classList.remove('ready');
    });
}

function updateMonthlyProgressSection() {
    const offset = appState.progressView?.monthOffset || 0;
    const now = new Date();
    const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const nextMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth()+1, 1);
    const daysInMonth = Math.round((nextMonth - monthStart)/(24*60*60*1000));
    
    // Update month label
    const label = document.getElementById('monthProgressLabel');
    if (label) {
        if (offset === 0) {
            label.textContent = '������� �����';
        } else {
            const monthNames = ['������', '�������', '����', '������', '���', '����',
                              '����', '������', '��������', '�������', '������', '�������'];
            const monthName = monthNames[targetMonth.getMonth()];
            const year = targetMonth.getFullYear();
            label.textContent = `${monthName} ${year}`;
        }
    }
    
    let monthXP = 0;
    const xpByDay = [];
    for (let i=0;i<daysInMonth;i++) {
        const d = new Date(monthStart);
        d.setDate(monthStart.getDate()+i);
        const key = formatDate(d);
        const logs = appState.activityData[key] || [];
        const dayXP = logs.reduce((s,l)=>s+(l.xpEarned||0),0);
        xpByDay.push(dayXP);
        monthXP += dayXP;
    }
    const pct = Math.min(100, Math.round((monthXP / 3000) * 100));
    const bar = document.getElementById('monthlyBar');
    if (bar) bar.style.width = `${pct}%`;
    const text = document.getElementById('monthlyProgressText');
    if (text) text.textContent = `${monthXP} / 3000 XP`;
    renderMonthlyInlineChart(monthStart, xpByDay);
    updateMonthNavControls();
}

function renderMonthlyInlineChart(monthStart, xpByDay) {
    const container = document.getElementById('monthlyInlineChart');
    if (!container) return;
    const max = Math.max(50, ...xpByDay);
    const days = xpByDay.length;
    container.innerHTML = Array.from({length: days}).map((_,i)=>{
        const val = xpByDay[i];
        const d = new Date(monthStart);
        d.setDate(monthStart.getDate()+i);
        const h = Math.round((val/max)*100);
        return `
            <div class=\"bar\" title=\"${d.toLocaleDateString('ru-RU')}: ${val} XP\">
                <div class=\"bar-column\" aria-label=\"${val} XP\">
                    <div class=\"bar-value\" style=\"height:${h}%\"></div>
                </div>
                <div class=\"bar-xp\" style=\"font-size:0.7rem\">${val}</div>
                <div class=\"bar-label\" style=\"font-size:0.65rem\">${i+1}</div>
            </div>
        `;
    }).join('');
}

function renderTasks() {
    const taskList = safeGetCachedElement("taskList");
    if (!taskList) return;
    
    // ����������, ��� tasks ���������������
    if (!appState.tasks || !Array.isArray(appState.tasks)) {
        console.warn('?? tasks �� ���������������, ������������� ������ ������');
        appState.tasks = [];
    }
    
    // ����������/�������� ������ ���������� ������� � ����������� �� ����
    const addTaskBtn = document.getElementById('addTaskBtn');
    if (addTaskBtn) {
        addTaskBtn.style.display = appState.role === 'admin' ? 'inline-flex' : 'none';
    }
    
    taskList.innerHTML = appState.tasks
        .map(
            (task) => `
    <div class="task-item">
        <div class="task-main" onclick="completeTask(event, ${task.id})" onkeydown="if(event.key==='Enter'||event.key===' '){completeTask(event, ${task.id})}" role="button" tabindex="0">
            <div class="task-header">
            <div class="task-icon">
                ${task.icon}
            </div>
            <div class="task-details">
                <h4>${escapeHTML(task.name)}</h4>
                    <button class="btn-description" onclick="showTaskDescription(event, ${task.id})" title="��������� ��������" aria-label="��������� ��������">
                        ?? ���������
                    </button>
            </div>
        </div>
            <div class="task-meta">
                <div class="task-duration">?? ${task.duration} ���</div>
                <div class="task-reward">? +${task.xpReward} XP</div>
            </div>
            </div>
            ${appState.role === 'admin' ? `
        <div class="task-actions">
            <button class="btn-icon-edit" onclick="editTask(${task.id})" title="������������� �������" aria-label="������������� �������">
                ??
            </button>
            <button class="btn-icon-delete" onclick="deleteTask(${task.id})" title="������� �������" aria-label="������� �������">
                ???
            </button>
        </div>
            ` : ''}
    </div>
`,
        )
        .join("");
    
    // ����������� ��� iPhone: ����������������� ����������� �������
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        // ������������� ��������� z-index � pointer-events ��� ���� ���������
        const taskItems = taskList.querySelectorAll('.task-item');
        taskItems.forEach(item => {
            item.style.position = 'relative';
            item.style.zIndex = '1';
            item.style.pointerEvents = 'auto';
            
            const buttons = item.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.style.position = 'relative';
                btn.style.zIndex = '2';
                btn.style.pointerEvents = 'auto';
            });
        });
    }
}

// Function to show task description modal
function showTaskDescription(event, taskId) {
    event.stopPropagation(); // Prevent task completion when clicking description button
    
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Create modal content
    const modalContent = `
        <div class="description-modal-overlay" onclick="hideTaskDescription()">
            <div class="description-modal-content" onclick="event.stopPropagation()">
                <div class="description-modal-header">
                    <div class="description-modal-icon">${task.icon}</div>
                    <h3 class="description-modal-title">${escapeHTML(task.name)}</h3>
                    <button class="description-modal-close" onclick="hideTaskDescription()" aria-label="�������">
                        ?
                    </button>
                </div>
                <div class="description-modal-body">
                    <div class="description-modal-meta">
                        <div class="description-meta-item">
                            <span class="description-meta-icon">??</span>
                            <span class="description-meta-text">${task.duration} �����</span>
                        </div>
                        <div class="description-meta-item">
                            <span class="description-meta-icon">?</span>
                            <span class="description-meta-text">+${task.xpReward} XP</span>
                        </div>
                    </div>
                    <div class="description-modal-description">
                        <h4>�������� �������:</h4>
                        <p>${escapeHTML(task.description)}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Add animation class after a small delay
    requestAnimationFrame(() => {
        const modal = document.querySelector('.description-modal-overlay');
        if (modal) {
            modal.classList.add('show');
        }
    });
}

// Function to hide task description modal
function hideTaskDescription() {
    const modal = document.querySelector('.description-modal-overlay');
    if (modal) {
        modal.classList.remove('show');
        safeSetTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function renderRewards() {
    // ����������, ��� rewards ���������������
    if (!appState.rewards || !Array.isArray(appState.rewards)) {
        console.warn('?? rewards �� ���������������, ������������� ������ ������');
        appState.rewards = [];
    }
    
    // Update achievements bank
    updateAchievementsBank();
    
    // Update rewards bank
    updateRewardsBank();
}

function clearRewards() {
    if (confirm('������� ��� ����������� �������?')) {
        console.log('?? ������� ��� �������...');
        
        appState.rewards = [];
        
        console.log('?? ������� �������, ������������� ��� ����������...');
        
        // ������ �������� ���� �����������
        
        // 1. ������������� ���� �������� � ���� (������� ������)
        recalculateAllProgress();
        
        // 2. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        renderRewards();
        updateProgressDisplay();
        updateBestWeekDisplay();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        
        // 3. ���������, ��� ��� ���������� ���������
        console.log('? ������� �������, ���������� ���������');
        
        showNotification('��� ������� �������! ��� ���������� �����������.', 'success');
        
        // ������������� ��������� � Firebase ����� ������� ������
        saveDataToFirebaseSilent();
    }
}

function generateCalendar() {
    const calendar = document.getElementById("calendar");
    const monthTitle = document.getElementById("monthTitle");

    // ��������� � ���������� currentMonth ���� �����
    let currentMonth = appState.currentMonth;
    if (!currentMonth || typeof currentMonth.getFullYear !== 'function') {
        console.warn('?? currentMonth �� �������� �������� Date, ����������...');
        currentMonth = new Date();
        appState.currentMonth = currentMonth;
    }
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthNames = [
        "������",
        "�������",
        "����",
        "������",
        "���",
        "����",
        "����",
        "������",
        "��������",
        "�������",
        "������",
        "�������",
    ];

    monthTitle.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = new Date(firstDay);
    startDay.setDate(
        startDay.getDate() - ((firstDay.getDay() + 6) % 7),
    );

    const today = new Date();
    const selectedDate = appState.selectedDate;

    let days = "";
    let currentDay = new Date(startDay);

    for (let i = 0; i < 42; i++) {
        const dayStr = formatDate(currentDay);
        const isCurrentMonth = currentDay.getMonth() === month;
        const isToday =
            formatDate(currentDay) === formatDate(today);
        const isSelected =
            formatDate(currentDay) === formatDate(selectedDate);
        const hasActivity = appState.activityData[dayStr];

        let classes = "calendar-day";
        if (isToday) classes += " today";
        if (isSelected) classes += " selected";
        if (!isCurrentMonth) classes += " other-month";

        // ���������� ������� ���������� �� ������� ��������
        if (hasActivity && hasActivity.length > 0) {
            const totalTimeSpent = hasActivity.reduce((sum, log) => {
                return sum + (log.timeSpent || 0);
            }, 0);

            if (totalTimeSpent > 0) {
                if (totalTimeSpent < 30) {
                    classes += " activity-low";
                } else if (totalTimeSpent < 60) {
                    classes += " activity-medium";
                } else if (totalTimeSpent < 120) {
                    classes += " activity-high";
                } else {
                    classes += " activity-very-high";
                }
            } else {
                classes += " active"; // ������ ����� ��� �������������
            }
        }

        days += `
        <div class="${classes}" onclick="selectDate('${dayStr}')" title="${dayStr}: ${hasActivity && hasActivity.length > 0 ? formatTime(hasActivity.reduce((sum, log) => sum + (log.timeSpent || 0), 0)) : '��� ����������'}">
            ${currentDay.getDate()}
        </div>
    `;

        currentDay.setDate(currentDay.getDate() + 1);
    }

    calendar.innerHTML = days;
}

function updateDayActivity() {
    // ��������� � ���������� selectedDate ���� �����
    let selectedDate = appState.selectedDate;
    if (!selectedDate || typeof selectedDate.toLocaleDateString !== 'function') {
        console.warn('?? selectedDate �� �������� �������� Date, ����������...');
        selectedDate = new Date();
        appState.selectedDate = selectedDate;
    }
    
    const selectedDateStr = formatDate(selectedDate);
    const dayActivity = document.getElementById("dayActivity");
    const selectedDateTitle =
        document.getElementById("selectedDateTitle");

    const dateStr = selectedDate.toLocaleDateString("ru-RU");
    selectedDateTitle.textContent = `���������� �� ${dateStr}`;

    const activity = appState.activityData[selectedDateStr];
    if (activity && activity.length > 0) {
        const totalXP = activity.reduce(
            (sum, log) => sum + log.xpEarned,
            0,
        );
        const totalTime = activity.reduce(
            (sum, log) => sum + (log.timeSpent || 0),
            0,
        );
        dayActivity.innerHTML = `
        <div style="color: #059669; font-weight: 600;">
            ��������� �������: ${activity.length} � �������� XP: +${totalXP}
        </div>
        <div style="color: #1e40af; font-weight: 600; margin-top: 4px;">
            ����� ��������: ${formatTime(totalTime)}
        </div>
        <div style="margin-top: 8px;">
            ${activity
                .map(
                    (log, index) => `
                <div class="activity-item" data-date="${selectedDateStr}" data-index="${index}">
                    ${escapeHTML(log.taskName)} (+${log.xpEarned} XP � ${formatTime(log.timeSpent || 0)})
                    <button class="activity-delete" onclick="deleteActivity('${selectedDateStr}', ${index})" title="������� ������ ����������" aria-label="������� ������ ����������">
                        ?
                    </button>
                </div>
            `,
                )
                .join("")}
        </div>
    `;
    } else {
        dayActivity.innerHTML = `
        <div style="color: #64748b;">
            ���� ��� ���������� �� ��������� ����
        </div>
    `;
    }
}

// Event Handlers
function completeTask(e, taskId) {
    if (appState.role === 'viewer') { showNotification('����� ���������: �������� ����������', 'info'); return; }
    const task = appState.tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Show confirmation modal instead of immediate completion
    showTaskCompletionModal(task);
}

// Function to show task completion confirmation modal
function showTaskCompletionModal(task) {
    // Calculate initial weekly progress for today's date
    const today = new Date();
    const weekStart = getWeekStartForDate(today);
    const currentWeekXP = computeWeekXP(weekStart);
    const initialXP = task.xpReward; // ��������� �������� XP �� �������
    const initialTotalXP = currentWeekXP + initialXP; // ������� + ����������� XP
    const initialProgressPercent = getWeeklyProgressPercent(initialTotalXP);
    const initialStage = getWeeklyProgressStage(initialTotalXP);
    
    // Create modal content
    const modalContent = `
        <div class="completion-modal-overlay" onclick="hideTaskCompletionModal()">
            <div class="completion-modal-content" onclick="event.stopPropagation()">
                <div class="completion-modal-header">
                    <div class="completion-modal-icon">${task.icon}</div>
                    <h3 class="completion-modal-title">������������� ����������</h3>
                    <button class="completion-modal-close" onclick="hideTaskCompletionModal()" aria-label="�������">
                        ?
                    </button>
                </div>
                <div class="completion-modal-body">
                    <div class="completion-task-info">
                        <h4>${escapeHTML(task.name)}</h4>
                        <p class="completion-task-description">${escapeHTML(task.description)}</p>
                    </div>
                    
                    <div class="completion-adjustments">
                        <h4>��������� ����������:</h4>
                        <p class="completion-hint">������� ���� ���������� � �������� �������� XP � ������� (�� 1 �� 500):</p>
                        
                        <div class="completion-input-group">
                            <label for="completionDate">���� ����������:</label>
                            <div class="completion-input-wrapper">
                                <input type="date" id="completionDate" value="${new Date().toISOString().split('T')[0]}" max="${new Date().toISOString().split('T')[0]}" class="completion-input">
                            </div>
                        </div>
                        
                        <div class="completion-input-group">
                            <label for="completionXP">�������� XP:</label>
                            <div class="completion-input-wrapper">
                                <input type="number" id="completionXP" value="${task.xpReward}" min="1" max="500" class="completion-input">
                                <span class="completion-input-suffix">XP</span>
                            </div>
                        </div>
                        
                        <div class="completion-input-group">
                            <label for="completionTime">��������� �������:</label>
                            <div class="completion-input-wrapper">
                                <input type="number" id="completionTime" value="${task.duration}" min="1" max="500" class="completion-input">
                                <span class="completion-input-suffix">���</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="completion-weekly-progress">
                        <h4>��������� ��������:</h4>
                        <div class="weekly-progress-container">
                            <div class="weekly-progress-bar ${initialStage}">
                                <div class="weekly-progress-fill" id="weeklyProgressFill" style="width: ${initialProgressPercent}%"></div>
                                <div class="weekly-progress-text">
                                    <span class="current-weekly-xp">${initialTotalXP}</span>
                                    <span class="weekly-xp-separator">/</span>
                                    <span class="max-weekly-xp">750</span>
                                    <span class="weekly-xp-label">XP</span>
                                </div>
                            </div>
                            <div class="weekly-progress-preview" id="weeklyProgressPreview">
                                <div class="xp-addition-animation">
                                    <span class="xp-addition-text">+<span id="previewXPAddition">${task.xpReward}</span> XP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="completion-modal-footer">
                    <button class="btn btn-secondary" onclick="hideTaskCompletionModal()">
                        ������
                    </button>
                    <button class="btn btn-primary" onclick="confirmTaskCompletion(${task.id})">
                        ? ����������� ����������
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalContent);
    
    // Add event listeners for real-time preview updates
    const xpInput = document.getElementById('completionXP');
    const timeInput = document.getElementById('completionTime');
    const dateInput = document.getElementById('completionDate');
    
    xpInput.addEventListener('input', updateCompletionPreview);
    timeInput.addEventListener('input', updateCompletionPreview);
    dateInput.addEventListener('change', updateCompletionPreview);
    
    // Initial preview update to show correct progress
    requestAnimationFrame(() => {
        updateCompletionPreview();
    });
    
    // Add animation class after a small delay
    requestAnimationFrame(() => {
        const modal = document.querySelector('.completion-modal-overlay');
        if (modal) {
            modal.classList.add('show');
        }
    });
}

// Function to update completion preview
function updateCompletionPreview() {
    const xpInput = document.getElementById('completionXP');
    const timeInput = document.getElementById('completionTime');
    const dateInput = document.getElementById('completionDate');
    
    if (!xpInput || !timeInput || !dateInput) return;
    
    const newXP = parseInt(xpInput.value) || 0;
    const newTime = parseInt(timeInput.value) || 0;
    const completionDate = new Date(dateInput.value);
    
    // Update XP addition text
    const previewXPAddition = document.getElementById('previewXPAddition');
    if (previewXPAddition) {
        previewXPAddition.textContent = newXP;
    }
    
    // Calculate current weekly XP for the selected date's week
    const weekStart = getWeekStartForDate(completionDate);
    const currentWeekXP = computeWeekXP(weekStart);
    const newWeeklyXP = currentWeekXP + newXP;
    
    // Calculate new progress percentage (based on 750 XP max)
    const newProgressPercent = Math.min(100, (newWeeklyXP / 750) * 100);
    const newStage = getWeeklyProgressStage(newWeeklyXP);
    
    // Update weekly progress bar with animation
    const weeklyProgressFill = document.getElementById('weeklyProgressFill');
    const weeklyProgressBar = document.querySelector('.weekly-progress-bar');
    const currentWeeklyXPText = document.querySelector('.current-weekly-xp');
    
    if (weeklyProgressFill && weeklyProgressBar) {
        // Update progress bar class for color changes
        weeklyProgressBar.className = `weekly-progress-bar ${newStage}`;
        
        // Animate the progress bar
        weeklyProgressFill.style.transition = 'width 0.5s ease-out';
        weeklyProgressFill.style.width = newProgressPercent + '%';
        
        // Update current XP text
        if (currentWeeklyXPText) {
            currentWeeklyXPText.textContent = newWeeklyXP;
        }
        
        // Add pulse animation to show XP addition
        const xpAdditionAnimation = document.querySelector('.xp-addition-animation');
        if (xpAdditionAnimation) {
            xpAdditionAnimation.classList.add('pulse');
            safeSetTimeout(() => {
                xpAdditionAnimation.classList.remove('pulse');
            }, 500);
        }
    }
    
    console.log('?? ��������������� �������� ���������� ���������:', {
        completionDate: completionDate.toISOString().split('T')[0],
        weekStart: weekStart.toISOString().split('T')[0],
        currentWeekXP: currentWeekXP,
        newXP: newXP,
        newWeeklyXP: newWeeklyXP,
        progressPercent: newProgressPercent,
        stage: newStage
    });
}

// Function to hide task completion modal
function hideTaskCompletionModal() {
    const modal = document.querySelector('.completion-modal-overlay');
    if (modal) {
        modal.classList.remove('show');
        safeSetTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Function to confirm task completion with custom values
function confirmTaskCompletion(taskId) {
    const task = appState.tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    const dateInput = document.getElementById('completionDate');
    const xpInput = document.getElementById('completionXP');
    const timeInput = document.getElementById('completionTime');
    
    if (!dateInput || !xpInput || !timeInput) return;
    
    const completionDate = new Date(dateInput.value);
    const customXP = parseInt(xpInput.value);
    const customTime = parseInt(timeInput.value);
    
    // Validate date
    if (isNaN(completionDate.getTime())) {
        showNotification('�������� ���������� ���� ����������', 'error');
        return;
    }
    
    // Check if date is in the future (not allowed)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    completionDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    if (completionDate > today) {
        showNotification('������ ��������� ������� � �������. �������� ����������� ���� ��� ���� � �������.', 'error');
        return;
    }
    
    // Validate inputs
    if (isNaN(customXP) || customXP < 1 || customXP > 500) {
        showNotification('XP ������ ���� �� 1 �� 500', 'error');
        return;
    }
    
    if (isNaN(customTime) || customTime < 1 || customTime > 500) {
        showNotification('����� ������ ���� �� 1 �� 500 �����', 'error');
        return;
    }
    
    // Hide modal first
    hideTaskCompletionModal();
    
    // Execute task completion with custom values and date
    executeTaskCompletion(task, customXP, customTime, completionDate);
}

// Function to execute actual task completion
function executeTaskCompletion(task, customXP, customTime, completionDate = new Date()) {
    // Animate task completion
    const taskElement = document.querySelector(`[onclick*="completeTask(event, ${task.id})"]`).closest('.task-item');
    taskElement.classList.add("task-completed");

    safeSetTimeout(() => {
        // Log activity with custom values and date first
        const activityDate = formatDate(completionDate);
        if (!appState.activityData[activityDate]) {
            appState.activityData[activityDate] = [];
        }
        
        appState.activityData[activityDate].push({
            taskId: task.id,
            taskName: task.name,
            xpEarned: customXP,
            timeSpent: customTime,
            completedAt: completionDate,
        });

        console.log('?? ������� ���������, ������������� ��� ����������...');
        
        // ��������� ������� ������� ����� ����������
        const oldLevel = appState.progress.level;
        console.log('?? ��������� ������ �������:', oldLevel);
        
        // ������ �������� ���� ����������� (������� ��������)
        recalculateAllProgress();
        
        // ��������������� lastCheckedLevel �� ������ �������
        appState.progress.lastCheckedLevel = oldLevel;
        console.log('?? ��������������� lastCheckedLevel ��:', oldLevel, '����� �������:', appState.progress.level);
        
        // Achievement checks removed
        
        // 1. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        updateProgressDisplay();
        generateCalendar();
        updateDayActivity();
        renderWeeklyChart();
        updateBestWeekDisplay();
        updateRedeemControls();
        
        // ��������� ��������� �������� � ������ �������� ���������
        updateProgressWeekSection();
        
        updateMonthlyProgressSection();
        
        // Show task completion notification immediately
        showTaskCompletionNotification(task, customXP);
        
        // Delay star notifications to ensure modal is closed
        safeSetTimeout(() => {
            updateWeeklyStars();
        }, 1000); // 1 second delay to ensure modal is closed
        
        // Update achievements bank
        updateAchievementsBank();
        
        // Show completion notification
        const isToday = formatDate(completionDate) === formatDate(new Date());
        const dateStr = isToday ? '�������' : completionDate.toLocaleDateString('ru-RU');
        showNotification(`������� ��������� ${dateStr}! +${customXP} XP`, "success");
        
        // 3. ���������, ��� ��� ���������� ���������
        console.log('? ������� ���������, ���������� ���������');
        console.log('   - �������� XP:', customXP);
        console.log('   - ��������� �������:', customTime);
        console.log('   - ���� ����������:', activityDate);
        console.log('   - ����� ����� XP:', appState.progress.totalXP);
        console.log('   - ����� �������:', appState.progress.level);
        console.log('   - XP �� ������:', appState.progress.weeklyXP);
        console.log('   - ������ ������:', appState.progress.bestWeekXP);
        
        // ��������� ����������� ������� ��������
        updateLearningTimeDisplay();
        
        // ������������� ��������� � Firebase ����� ���������� �������
        // ����������� ��������, ����� ����������� � ������� ������ ����������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 3000); // 3 ������� ������ 1

        taskElement.classList.remove("task-completed");
    }, 100);
}

function addTask(event) {
    event.preventDefault();

    return safeExecute(() => {
        // ��������� ���� ������������
        if (appState.role === 'viewer') {
            showNotification('����� ���������: ���������� ������� ����������', 'warning');
            return;
        }

        const name = document.getElementById("taskName").value;
        const description =
            document.getElementById("taskDescription").value;
        let xpReward = parseInt(
            document.getElementById("taskXP").value, 10
        );
        let duration = parseInt(
            document.getElementById("taskDuration").value, 10
        );

        // ��������� ������
        const taskData = { name, xpReward, duration };
        validateTaskData(taskData);

    // ���� ���� �������� ������� �������� ����������� ������� �������
    if (name.trim().toLowerCase() === '��������' || name.trim().toLowerCase() === 'clear') {
        if (confirm('�������� ��� ����������� �������?')) {
            console.log('?? ������� ��� ������� ����� �������...');
            
            appState.tasks = [];
            
            console.log('?? ������� �������, ������������� ��� ����������...');
            
            // ������ �������� ���� �����������
            
            // 1. ������������� ���� �������� � ���� (������� ������)
            recalculateAllProgress();
            
            // 2. ������������� ������ ������
            recalculateBestWeek();
            
            // 2. ��������� ��� �����������
            renderTasks();
            updateProgressDisplay();
            updateBestWeekDisplay();
            updateRedeemControls();
            updateProgressWeekSection();
            updateMonthlyProgressSection();
            updateWeeklyStars();
            updateAchievementsBank();
            
            // 3. ���������, ��� ��� ���������� ���������
            console.log('? ������� ������� ����� �������, ���������� ���������');
            
            showNotification('��� ������� �������! ��� ���������� �����������.', 'success');
            
                                // ������������� ��������� � Firebase ����� ������� �������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);
        }
        document.getElementById("taskForm").reset();
        return;
    }

    if (Number.isNaN(xpReward)) xpReward = 50;
    if (Number.isNaN(duration)) duration = 15;
    xpReward = Math.min(500, Math.max(1, xpReward));
    duration = Math.min(500, Math.max(1, duration));

    const newTask = {
        id: Date.now(),
        name,
        description,
        xpReward,
        duration,
        icon: getSelectedIcon(),
        category: "custom",
    };

    appState.tasks.push(newTask);
    
    console.log('?? ����� ������� ���������, ������������� ��� ����������...');
    
    // ������ �������� ���� �����������
    
    // 1. ������������� ���� �������� � ���� (������� ������)
    recalculateAllProgress();
    
    // 2. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    renderTasks();
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    updateAchievementsBank();
    
                        // 3. ���������, ��� ��� ���������� ���������
        console.log('? ����� ������� ���������, ���������� ���������');
        
        hideTaskModal();
        showNotification("����� ������� ���������! ��� ���������� �����������.", "success");
        
        // ������������� ��������� � Firebase ����� ���������� �������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);

        // Reset form
        document.getElementById("taskForm").reset();
        renderWeeklyChart();
    }, 'addTask');
}

function addReward(event) {
    event.preventDefault();

    const starsCost = 3;
    const planned = appState.rewardPlan && appState.rewardPlan.description;
    if (!planned) {
        showNotification('������� ���������� �������', 'warning');
        return;
    }
    if ((appState.progress.starBank || 0) < starsCost) {
        showNotification('������������ ����� ��� ��������� �������!', 'error');
        return;
    }

    const newReward = {
        id: Date.now(),
        description: planned,
        starsUsed: starsCost,
        redeemedAt: new Date(),
    };

    appState.rewards.push(newReward);
    appState.rewardPlan = { description: "" };

    // Show reward notification
    showRewardNotification(planned, starsCost);

    console.log('?? ������� ��������, ������������� ��� ����������...');
    
    // ������ �������� ���� �����������
    
    // 1. ������������� ���� �������� � ���� (������� ������)
    recalculateAllProgress();
    
    // 2. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    renderRewards();
    updateProgressDisplay();
    updateWeeklyStars();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateAchievementsBank();
    
                        // 3. ���������, ��� ��� ���������� ���������
        console.log('? ������� ��������, ���������� ���������');
        
        hideRewardModal();
        showNotification("������� ��������! ��� ���������� �����������.", "success");
        
        // ������������� ��������� � Firebase ����� ��������� �������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);

    // Reset form
    document.getElementById("rewardForm").reset();
}

function selectDate(dateStr) {
    console.log('??? ������� ����:', dateStr);
    try {
        appState.selectedDate = new Date(dateStr);
        console.log('? ���� ������� �����������:', appState.selectedDate);
        generateCalendar();
        updateDayActivity();
        // �������������� ���������� ���������
        renderWeeklyChart();
    } catch (error) {
        console.error('? ������ ��� ������ ����:', error, 'dateStr:', dateStr);
    }
}

function changeMonth(direction) {
    appState.currentMonth = new Date(
        appState.currentMonth.getFullYear(),
        appState.currentMonth.getMonth() + direction,
        1,
    );
    generateCalendar();
    // �������������� ���������� ���������
    renderWeeklyChart();
}

// Icon Functions
function populateIconSelector() {
    const selector = document.getElementById('iconSelector');
    if (!selector) return;
    
    selector.innerHTML = availableIcons.map((icon, index) => `
        <div class="icon-option ${index === 0 ? 'selected' : ''}" 
             onclick="selectIcon(${index})" 
             title="${icon.name}"
             data-icon="${icon.class}">
            ${icon.class}
        </div>
    `).join('');
}

function selectIcon(index) {
    // Remove selected class from all options
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    const selectedOption = document.querySelectorAll('.icon-option')[index];
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

function getSelectedIcon() {
    const selectedOption = document.querySelector('.icon-option.selected');
    return selectedOption ? selectedOption.getAttribute('data-icon') : '??';
}

// Modal Functions
function showTaskModal() {
    console.log('?? ���������� ��������� ���� �������, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ����� ������� ���������� ���� �������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ��������� ���� ������� ��������, ��� ���������� �����������');
    
    // �������������� ���������� ��������� ��� ������ ���������� ����
    // saveDataToFirebase();
    
    document.getElementById("taskModal").classList.add("show");
    populateIconSelector(); // Populate icons when modal opens
}

function hideTaskModal() {
    document.getElementById("taskModal").classList.remove("show");
    // Reset icon selection to first icon
    safeSetTimeout(() => {
        const firstIcon = document.querySelector('.icon-option');
        if (firstIcon) {
            document.querySelectorAll('.icon-option').forEach(option => {
                option.classList.remove('selected');
            });
            firstIcon.classList.add('selected');
        }
    }, 100);
}

// Edit Task Modal Functions
function showEditTaskModal(taskId) {
    const task = appState.tasks.find(t => t.id === taskId);
    if (!task) {
        showNotification('������� �� �������', 'error');
        return;
    }

    // ��������� ���� ������������
    if (appState.role === 'viewer') {
        showNotification('����� ���������: �������������� ������� ����������', 'warning');
        return;
    }

    // ��������� ����� ������� �������
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskName').value = task.name;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskXP').value = task.xpReward;
    document.getElementById('editTaskDuration').value = task.duration;

    // ��������� �������� ������ � �������� �������
    populateEditIconSelector(task.icon);

    // ���������� ��������� ����
    document.getElementById("editTaskModal").classList.add("show");
}

function hideEditTaskModal() {
    document.getElementById("editTaskModal").classList.remove("show");
    // Reset icon selection to first icon
    safeSetTimeout(() => {
        const firstIcon = document.querySelector('#editIconSelector .icon-option');
        if (firstIcon) {
            document.querySelectorAll('#editIconSelector .icon-option').forEach(option => {
                option.classList.remove('selected');
            });
            firstIcon.classList.add('selected');
        }
    }, 100);
}

function populateEditIconSelector(selectedIcon) {
    const selector = document.getElementById('editIconSelector');
    if (!selector) return;
    
    selector.innerHTML = availableIcons.map((icon, index) => `
        <div class="icon-option ${icon.class === selectedIcon ? 'selected' : ''}" 
             onclick="selectEditIcon(${index})" 
             title="${icon.name}"
             data-icon="${icon.class}">
            ${icon.class}
        </div>
    `).join('');
}

function selectEditIcon(index) {
    // Remove selected class from all options
    document.querySelectorAll('#editIconSelector .icon-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked option
    const selectedOption = document.querySelectorAll('#editIconSelector .icon-option')[index];
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }
}

function getSelectedEditIcon() {
    const selectedOption = document.querySelector('#editIconSelector .icon-option.selected');
    return selectedOption ? selectedOption.getAttribute('data-icon') : '??';
}

function editTask(taskId) {
    showEditTaskModal(taskId);
}

function updateTask(event) {
    event.preventDefault();

    const taskId = parseInt(document.getElementById('editTaskId').value);
    const task = appState.tasks.find(t => t.id === taskId);
    
    if (!task) {
        showNotification('������� �� �������', 'error');
        return;
    }

    const name = document.getElementById('editTaskName').value;
    const description = document.getElementById('editTaskDescription').value;
    let xpReward = parseInt(document.getElementById('editTaskXP').value, 10);
    let duration = parseInt(document.getElementById('editTaskDuration').value, 10);

    if (Number.isNaN(xpReward)) xpReward = 50;
    if (Number.isNaN(duration)) duration = 15;
    xpReward = Math.min(500, Math.max(1, xpReward));
    duration = Math.min(500, Math.max(1, duration));

    // ��������� �������
    task.name = name;
    task.description = description;
    task.xpReward = xpReward;
    task.duration = duration;
    task.icon = getSelectedEditIcon();

    console.log('?? ������� ���������, ������������� ��� ����������...');
    
    // ������ �������� ���� �����������
    
    // 1. ������������� ���� �������� � ���� (������� ������)
    recalculateAllProgress();
    
    // 2. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    renderTasks();
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    updateLearningTimeDisplay();
    updateAchievementsBank();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ������� ���������, ���������� �����������');
    
    hideEditTaskModal();
    showNotification("������� ���������! ��� ���������� �����������.", "success");
    
    // ������������� ��������� � Firebase ����� ���������� �������
    safeSetTimeout(() => {
        saveDataToFirebaseSilent();
    }, 1000);
}

function showRewardModal() {
    updateRedeemControls();
    if (!appState.rewardPlan || !appState.rewardPlan.description) {
        // ���� ������� �� ������������� � ����� ������ ���������
        showIdeaModal();
        return;
    }
    if ((appState.progress.starBank || 0) < 3) {
        showNotification('������������ ����� (����� 3 ?)', 'info');
    }
    const planned = document.getElementById('plannedRewardDisplay');
    if (planned) planned.textContent = appState.rewardPlan.description || '�';
    const availableStarsEl = document.getElementById('availableStars');
    if (availableStarsEl) availableStarsEl.textContent = `${appState.progress.starBank || 0} ?`;
    const confirmBtn = document.getElementById('confirmRedeemBtn');
    if (confirmBtn) confirmBtn.disabled = (appState.progress.starBank || 0) < 3;
    
    console.log('?? ���������� ��������� ���� ������, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ����� ������� ���������� ���� ������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ��������� ���� ������ ��������, ��� ���������� �����������');
    
    // �������������� ���������� ��������� ��� ������ ���������� ����
    // saveDataToFirebase();
    
    document.getElementById("rewardModal").classList.add("show");
}
// Idea Modal
function showIdeaModal() {
    // ��������� ��������� ������������, ���� ��� ���� ��������������� �������
    if (appState.rewardPlan && appState.rewardPlan.description) {
        showNotification('������� ��� �������������. ������� �������� �, ����� ��������� �����.', 'info');
        return;
    }
    console.log('?? ���������� ��������� ���� ����, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ����� ������� ���������� ���� ����
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ��������� ���� ���� ��������, ��� ���������� �����������');
    
    // �������������� ���������� ��������� ��� ������ ���������� ����
    // saveDataToFirebase();
    
    document.getElementById('ideaModal').classList.add('show');
    const input = document.getElementById('ideaDescription');
    if (input) {
        renderIdeaSuggestions(input.value || '');
        input.focus();
    }
}
function hideIdeaModal() {
    document.getElementById('ideaModal').classList.remove('show');
    const box = document.getElementById('ideaAutocomplete');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
}
function saveRewardIdea(event) {
    event.preventDefault();
    const desc = document.getElementById('ideaDescription').value.trim();
    if (!desc) return;
    const cmd = desc.toLowerCase();
    if (cmd === '��������' || cmd === 'clear') {
        if (confirm('������� ��� ����������� �������?')) {
            console.log('?? ������� ��� ������� ����� �������...');
            
            appState.rewards = [];
            
            console.log('?? ������� �������, ������������� ��� ����������...');
            
            // ������ �������� ���� �����������
            
            // 1. ������������� ������ ������
            recalculateBestWeek();
            
            // 2. ��������� ��� �����������
            renderRewards();
            updateProgressDisplay();
            updateBestWeekDisplay();
            updateRedeemControls();
            updateProgressWeekSection();
            updateMonthlyProgressSection();
            updateWeeklyStars();
            
            // 3. ���������, ��� ��� ���������� ���������
            console.log('? ������� ������� ����� �������, ���������� ���������');
            
            showNotification('��� ������� �������! ��� ���������� �����������.', 'success');
            
                                // ������������� ��������� � Firebase ����� ������� ������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);
            
            saveState();
        }
        document.getElementById('ideaForm').reset();
        hideIdeaModal();
        updateRedeemControls();
        return;
    }
    appState.rewardPlan = { description: desc };
    addIdea(desc);
    
    console.log('?? ���� ������� ���������, ������������� ��� ����������...');
    
    // ������ �������� ���� �����������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ���� ������� ���������, ���������� ���������');
    
    hideIdeaModal();
    showNotification('������� ���������! ��� ���������� �����������.', 'success');
    
                        // ������������� ��������� � Firebase ����� ���������� ���� �������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);
    
    saveState();
    document.getElementById('ideaForm').reset();
}

function hideRewardModal() {
    document.getElementById("rewardModal").classList.remove("show");
}

// Check device type and capabilities
function checkDeviceCapabilities() {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);
    
    console.log('?? ���������� �� ����������:');
    console.log('   - User Agent:', userAgent);
    console.log('   - ��������� ����������:', isMobile);
    console.log('   - iOS:', isIOS);
    console.log('   - Android:', isAndroid);
    console.log('   - ������:', navigator.onLine);
    console.log('   - Cookie enabled:', navigator.cookieEnabled);
    
    // ��������� localStorage
    try {
        const testKey = 'device-test';
        const testValue = 'test-value-' + Date.now();
        localStorage.setItem(testKey, testValue);
        const retrievedValue = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        
        if (retrievedValue === testValue) {
            console.log('? localStorage �������� ���������');
        } else {
            console.error('? localStorage �������� �����������');
        }
    } catch (error) {
        console.error('? ������ ������������ localStorage:', error);
    }
    
    return { isMobile, isIOS, isAndroid };
}

// Initialize Application
function initApp() {
    console.log('?? ������������� ����������...');
    
    // ��������� ����������� ����������
    const deviceInfo = checkDeviceCapabilities();
    
    // ������� ��������� ������� ��������� �� localStorage
    loadLocalState();
    
    // ������������� ���������� ����������� ��� ������ �������
    appState.isVerified = false;
    console.log('?? ����� ����������� ��� ������� ����������');
    
    // ���������, ���� �� ����������� ������������
    const savedUserName = localStorage.getItem('current-user');
    if (savedUserName && (savedUserName === '������' || savedUserName === 'Admin')) {
        appState.userName = savedUserName;
        console.log(`?? ������������ ������������: ${savedUserName}`);
    }
    
    // �������������� �������� �� ��������� ��� ������� �������
    ensureDefaultValues();
    
    // ������������� ������� �������� �� ���������
    ensureWeeklyReset();
    
    console.log('?? ������������� ����������, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ��� �������������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ����-���������� ������ ���� � ���
    const hasAnyActivity = Object.keys(appState.activityData || {}).length > 0;
    if (!hasAnyActivity) {
        if (!appState.resetDate) appState.resetDate = new Date();
        const today = formatDate(new Date());
        const yesterday = formatDate(new Date(Date.now() - 86400000));

        appState.activityData[today] = [
            {
                taskId: 1,
                taskName: "�������� ����� ����",
                xpEarned: 50,
                timeSpent: 15,
                completedAt: new Date(),
            },
        ];

        appState.activityData[yesterday] = [
            {
                taskId: 2,
                taskName: "�������������� ����������",
                xpEarned: 75,
                timeSpent: 20,
                completedAt: new Date(Date.now() - 86400000),
            },
            {
                taskId: 3,
                taskName: "�����������",
                xpEarned: 60,
                timeSpent: 25,
                completedAt: new Date(Date.now() - 86400000),
            },
        ];
        
        console.log('? ����-���������� ���������');
    }
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ������������� ���������, ��� ���������� �����������');
    
    // ��������� ����������� ������� ��������
    updateLearningTimeDisplay();
    
    // ��������� ���� ����������
    updateAchievementsBank();
    
    // ��������� ���� ������
    updateRewardsBank();
    
    // �������������� ���������� ��������� ��� �������������
    // saveDataToFirebase();

    // ������������� ���� �� ���������
    if (!appState.role) appState.role = 'viewer';
    
    // �������������� ������ PIN-���� (��� ����������� ������ �� Firebase)
    if (!appState.pinCodes) {
        appState.pinCodes = {};
        console.log('?? PIN-���� ���������������� ��� ������ (�������� ������ �� Firebase)');
    }
    
    // �������������� bestWeekXP
    if (!appState.progress) {
        appState.progress = {};
    }
    if (typeof appState.progress.bestWeekXP === 'undefined') {
        appState.progress.bestWeekXP = 0;
        console.log('?? bestWeekXP ��������������� � initApp');
    }
    
    console.log('?? ��������� PIN-����� ��� �������������:', appState.pinCodes);
    console.log('?? ������� ������������:', appState.userName);
    console.log('?? PIN-���� ����� ��������� �� Firebase');
    
    // �� ���������� ����������� ����� - ���� ���������� �������������
    console.log('? ������� ���������� ������������� ����� ������� �����������...');
    
    // ���������� ��������� ��������
    showSyncStatus('syncing', '��������� ������...');
    
    // ������� ��� ������ ����������� ����� �������������
    const showVerificationAfterSync = () => {
        console.log('?? ��������� PIN-���� ����� �������������...');
        
        // ���������, ��������� �� PIN-���� �� Firebase
        if (Object.keys(appState.pinCodes).length === 0) {
            console.log('? PIN-���� �� ��������� �� Firebase');
            showNotification('PIN-���� �� ���������. ��������� ��������-����������.', 'error');
            
            // ���������� ����� ������� ������, ���� PIN-���� �� ���������
            showAccountSelection();
            return;
        }
        
        // ���������, ���� �� � ������������ PIN-���
        const hasPin = appState.pinCodes[appState.userName];
        console.log(`?? ��������� �������� PIN-���� ��� ${appState.userName}:`, hasPin ? '������' : '�� ������');
        
        if (hasPin) {
            // ���� PIN-��� ����, ���������� �����������
            console.log('?? PIN-��� ������, ���������� �����������');
            
            console.log('?? ���������� �����������, ������������� ��� ����������...');
            
            // ������ �������� ���� ����������� ����� ������� �����������
            
            // 1. ������������� ������ ������
            recalculateBestWeek();
            
            // 2. ��������� ��� ����������� ���������
            safeUpdateUI();
            updateBestWeekDisplay();
            updateRedeemControls();
            updateProgressWeekSection();
            updateMonthlyProgressSection();
            updateWeeklyStars();
            
            // 3. ���������, ��� ��� ���������� ���������
            console.log('? ����������� ��������, ��� ���������� �����������');
            
            // ��������� ����������� ������� ��������
            updateLearningTimeDisplay();
            
            // ��������� ���� ��� ����������� ����������� ������ ��������
            applyRolePermissions();
            
            // ��������������� ��������� ������ (��� �������� �� ���������)
            restoreSettingsBlocksState();
            
            // �������������� ���������� ��������� ��� ������ �����������
            // saveDataToFirebase();
            
            showVerificationModal();
        } else {
            // ���� PIN-���� ���, ���������� ����� ������� ������
            console.log('?? PIN-��� �� ������, ���������� ����� ������� ������');
            
            // �������������� ���������� ��������� ��� ������ ������ ������� ������
            // saveDataToFirebase();
            
            showAccountSelection();
        }
    };

    console.log('?? ��������� UI ����� �������������...');
    
    // ������ �������� ���� ����������� � ���������� UI
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    renderTasks();
    renderRewards();
    generateCalendar();
    updateDayActivity();
    renderWeeklyChart();
    updateRedeemControls();
    updateBestWeekDisplay();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    populateIconSelector();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? UI ��������, ��� ���������� �����������');
    
    // ��������� ����������� ������� ��������
    updateLearningTimeDisplay();
    
    // ��������� ���� ��� ����������� ����������� ������ ��������
    applyRolePermissions();
    
    // �������������� ���������� ��������� ��� ���������� UI
    // saveDataToFirebase();
    
    // ��������� ����������� ��� ������ Firebase
    const testFirebaseBtn = document.getElementById('testFirebaseBtn');
    if (testFirebaseBtn) {
        testFirebaseBtn.addEventListener('click', testFirebaseConnection);
    }
    
    console.log('? ���������� ����������������');
    
    // �������������� PWA
    initPWA();
    
    // ������������� ���� ���������� �������������
    appState.isInitializing = false;
    
    // ��������������� ��������� ������ ��������
    restoreSettingsBlocksState();
    
    // �������������� ������ �������������
    updateSyncStatus();
    
    // ���������, ����� �� ��������� ������������� (� ���������, ����� �� ������ �������� PIN-�����)
    safeSetTimeout(() => {
        checkFirstTimeSync();
    }, 1000);
    
    // ��������� ������� - ���� ���-�� ����� �� ���, ���������� ����������� ����� 10 ������
    const fallbackTimeout = safeSetTimeout(() => {
        console.log('? ��������� �������: ���������� ����������� �������������...');
        showSyncStatus('error', '�������������� ������');
        showVerificationAfterSync();
    }, 10000);
    
    // ��������� PIN-���� �� Firebase ��� �������
    if (navigator.onLine && isFirebaseAvailable()) {
        console.log('?? ��������� PIN-���� �� Firebase...');
        
        loadPinCodesFromFirebase().then(success => {
            if (success) {
                console.log('? PIN-���� ��������� �� Firebase');
            } else {
                console.log('?? PIN-���� �� ������� � Firebase');
            }
            
            // ����� �������� �� Firebase ���������� �����������
            console.log('?? Firebase ������������� ���������, ���������� �����������...');
            clearTimeout(fallbackTimeout); // �������� ��������� �������
            showSyncStatus('success', '������ ���������');
            showVerificationAfterSync();
        }).catch(error => {
            console.log('? ������ �������� PIN-����� �� Firebase:', error);
            
            // ���� ��� ������ ���������� �����������
            console.log('?? Firebase ������������� �� �������, ���������� �����������...');
            clearTimeout(fallbackTimeout); // �������� ��������� �������
            showSyncStatus('error', '������ �������������');
            showVerificationAfterSync();
        });
    } else {
        // ���� Firebase ����������, ���������� ����������� �����
        console.log('?? Firebase ����������, ���������� �����������...');
        clearTimeout(fallbackTimeout); // �������� ��������� �������
        showSyncStatus('offline', '������ �����');
        showVerificationAfterSync();
    }

    // ��������� ��������� ��������� ������� ���� ��� ������������
    window.addEventListener('resize', handleResize);
}

// Delete Task Function
function deleteTask(taskId) {
    // ��������� ���� ������������
    if (appState.role === 'viewer') {
        showNotification('����� ���������: �������� ������� ����������', 'warning');
        return;
    }
    
    if (confirm('�� �������, ��� ������ ������� ��� �������?')) {
        console.log('?? ������� �������...');
        
        appState.tasks = appState.tasks.filter(task => task.id !== taskId);
        
        console.log('?? ������� �������, ������������� ��� ����������...');
        
        // ������ �������� ���� �����������
        
        // 1. ������������� ���� �������� � ���� (������� ������)
        recalculateAllProgress();
        
        // 2. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        renderTasks();
        updateProgressDisplay();
        updateBestWeekDisplay();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        updateAchievementsBank();
        
        // 3. ���������, ��� ��� ���������� ���������
        console.log('? ������� �������, ���������� ���������');
        
        showNotification('������� �������! ��� ���������� �����������.', 'success');
        
        // ������������� ��������� � Firebase ����� �������� �������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);
    }
}

// Delete Activity Function with full state recalculation
function deleteActivity(dateStr, index) {
    if (appState.role === 'viewer') { 
        showNotification('����� ���������: �������� ���������� ����������', 'warning'); 
        return; 
    }
    if (!confirm('������� ��� ������ ����������? ��� �������� �� ��� ��������.')) {
        return;
    }

    console.log('?? ������� ������ ����������...');
    
    const activity = appState.activityData[dateStr];
    if (!activity || !activity[index]) return;

    const deletedLog = activity[index];
    const deletedXP = deletedLog.xpEarned;

    // Remove the activity log
    activity.splice(index, 1);
    if (activity.length === 0) {
        delete appState.activityData[dateStr];
    }

    console.log('?? ���������� �������, ������������� ��� ����������...');

    // ������ �������� ���� �����������
    
    // 1. ������������� ���� �������� � ����
    recalculateAllProgress();

    // 2. ������������� ������ ������
    recalculateBestWeek();

    // 3. ��������� ��� �����������
    updateProgressDisplay();
    generateCalendar();
    updateDayActivity();
    renderWeeklyChart();
    updateRedeemControls();
    
    // 4. ������������� ��������� ����������� ������ ������
    updateBestWeekDisplay();
    
    // 5. ��������� ��������� � �������� ������
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    
    // 6. ��������� ������
    updateWeeklyStars();
    
    // 7. ��������� ���� ����������
    updateAchievementsBank();
    
    // 8. ���������, ��� ��� ���������� ���������
    console.log('? ���������� �������, ��� ���������� �����������');
    console.log('   - ������� XP:', deletedXP);
    console.log('   - ����� ����� XP:', appState.progress.totalXP);
    console.log('   - ����� �������:', appState.progress.level);
    console.log('   - XP �� ������:', appState.progress.weeklyXP);
    console.log('   - ������ ������:', appState.progress.bestWeekXP);

                        // ������������� ��������� � Firebase ����� �������� ����������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);

    showNotification(`���������� ������� (-${deletedXP} XP)! ��� ���������� �����������.`, 'success');
}

// Test function to verify weekly calculations
function testWeeklyCalculations() {
    console.log('?? ������������ ��������� ��������...');
    
    // Test getWeekStartKey
    const testDates = [
        new Date('2025-01-15'), // Wednesday
        new Date('2025-01-13'), // Monday
        new Date('2025-01-19'), // Sunday
    ];
    
    testDates.forEach(date => {
        const weekStart = getWeekStartKey(date);
        console.log(`?? ${date.toLocaleDateString('ru-RU')} (${['��','��','��','��','��','��','��'][date.getDay()]}) -> ������ ����������: ${weekStart}`);
    });
    
    // Test weekly data calculation
    const dates = Object.keys(appState.activityData).sort();
    console.log('?? ��� ���� �����������:', dates);
    
    const weeklyData = {};
    dates.forEach(dateStr => {
        const logs = appState.activityData[dateStr];
        if (!Array.isArray(logs)) return;
        
        const dayXP = logs.reduce((sum, log) => sum + (log.xpEarned || 0), 0);
        const weekKey = getWeekStartKey(new Date(dateStr));
        
        if (!weeklyData[weekKey]) weeklyData[weekKey] = { xp: 0, tasks: 0 };
        weeklyData[weekKey].xp += dayXP;
        weeklyData[weekKey].tasks += logs.length;
        
        console.log(`?? ${dateStr}: ${dayXP} XP -> ������ ${weekKey} (�����: ${weeklyData[weekKey].xp} XP)`);
    });
    
    console.log('?? �������� ��������� ������:', weeklyData);
    
    // Test current week
    const currentWeekKey = getWeekStartKey(new Date());
    console.log(`?? ������� ������: ${currentWeekKey}`);
    console.log(`?? XP �� ������� ������: ${weeklyData[currentWeekKey]?.xp || 0}`);
}

// Test function for cross-week scenarios
function testCrossWeekScenarios() {
    console.log('?? ������������ ������������ ���������...');
    
    // Test current week calculation
    const currentWeekKey = getWeekStartKey(new Date());
    const currentWeekXP = computeWeekXP(new Date(currentWeekKey));
    console.log(`?? ������� ������ (${currentWeekKey}): ${currentWeekXP} XP`);
    
    // Test previous week calculation
    const prevWeek = new Date(currentWeekKey);
    prevWeek.setDate(prevWeek.getDate() - 7);
    const prevWeekKey = formatDate(prevWeek);
    const prevWeekXP = computeWeekXP(prevWeek);
    console.log(`?? ���������� ������ (${prevWeekKey}): ${prevWeekXP} XP`);
    
    // Test next week calculation
    const nextWeek = new Date(currentWeekKey);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekKey = formatDate(nextWeek);
    const nextWeekXP = computeWeekXP(nextWeek);
    console.log(`?? ��������� ������ (${nextWeekKey}): ${nextWeekXP} XP`);
    
    // Test weekly progress display
    console.log(`?? ������������ ��������� ��������: ${appState.progress.weeklyXP} XP`);
    console.log(`?? ������ �� ������: ${appState.progress.weeklyStars}`);
    console.log(`?? ���� �����: ${appState.progress.starBank}`);
    
    // Test best week
    console.log(`?? ������ ������: ${appState.progress.bestWeekXP} XP`);
}

// Recalculate all progress from activity data
function recalculateAllProgress() {
    // Reset progress to base values
    appState.progress.totalXP = 0;
    appState.progress.level = 1;
    appState.progress.currentLevelXP = 0;
    appState.progress.weeklyXP = 0;
    appState.progress.weeklyStars = 0;
    appState.progress.starBank = 0;
    appState.progress.lastCheckedLevel = 0; // ���������� ������� ����������

    // Get all activity dates sorted chronologically
    const dates = Object.keys(appState.activityData).sort();
    
    // Track weekly progress by week start key
    const weeklyData = {};
    let totalXP = 0;

    for (const dateStr of dates) {
        const logs = appState.activityData[dateStr];
        if (!Array.isArray(logs)) continue;

        const dayXP = logs.reduce((sum, log) => sum + (log.xpEarned || 0), 0);
        totalXP += dayXP;

        // Track weekly XP
        const weekKey = getWeekStartKey(new Date(dateStr));
        if (!weeklyData[weekKey]) weeklyData[weekKey] = { xp: 0, tasks: 0 };
        weeklyData[weekKey].xp += dayXP;
        weeklyData[weekKey].tasks += logs.length;
    }

    // Set total XP and calculate level
    appState.progress.totalXP = totalXP;
    
    // Calculate level from total XP (810 XP per level)
    const xpPerLevel = 810;
    appState.progress.level = Math.min(100, Math.floor(totalXP / xpPerLevel) + 1);
    appState.progress.currentLevelXP = totalXP % xpPerLevel;
    
    // If at max level, set currentLevelXP to 0
    if (appState.progress.level >= 100) {
        appState.progress.level = 100;
        appState.progress.currentLevelXP = 0;
    }

    // Calculate current week progress
    const currentWeekKey = getWeekStartKey(new Date());
    appState.progress.weeklyXP = weeklyData[currentWeekKey] ? weeklyData[currentWeekKey].xp : 0;
    appState.progress.weekStartKey = currentWeekKey;

    // Calculate stars earned this week and transfer to star bank
    const weeklyStars = calculateWeeklyStars(appState.progress.weeklyXP);
    appState.progress.weeklyStars = weeklyStars;

    // Calculate total star bank from all weeks
    let totalStars = 0;
    for (const weekKey in weeklyData) {
        const weekXP = weeklyData[weekKey].xp;
        totalStars += calculateWeeklyStars(weekXP);
    }
    
    // Calculate total stars spent on rewards
    const totalStarsSpent = appState.rewards.reduce((sum, reward) => sum + (reward.starsUsed || 0), 0);
    appState.progress.starBank = Math.max(0, totalStars - totalStarsSpent);
    
    // ��������� ��������� ������ ��� ��������� ������ ������
    appState.weeklyData = weeklyData;
    
    // ��������� lastCheckedLevel ��� ���������� ������ ������� ����������
    appState.progress.lastCheckedLevel = appState.progress.level;
    
    console.log('?? ������ �������� ��������� ��������, ������������� ��� ����������...');
    
    // Test weekly calculations for debugging
    testWeeklyCalculations();
    
    // Additional test for cross-week scenarios
    testCrossWeekScenarios();
    
    // ������ �������� ���� ����������� ����� ��������� ���������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    updateAchievementsBank();
    
                        // 3. ���������, ��� ��� ���������� ���������
        console.log('? ������ �������� ��������� ��������, ��� ���������� �����������');
        console.log('?? ��������� ������ ���������:', weeklyData);
        console.log('?? ������� ������ XP:', appState.progress.weeklyXP);
        
        // ������������� ��������� � Firebase ����� ������� ��������� ���������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);
}

function clearTasks() {
    // ��������� ���� ������������
    if (appState.role === 'viewer') {
        showNotification('����� ���������: ������� ������� ����������', 'warning');
        return;
    }
    
    if (confirm('������� ��� ����������� �������?')) {
        console.log('?? ������� ��� �������...');
        
        appState.tasks = [];
        
        console.log('?? ������� �������, ������������� ��� ����������...');
        
        // ������ �������� ���� �����������
        
        // 1. ������������� ���� �������� � ���� (������� ������)
        recalculateAllProgress();
        
        // 2. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        renderTasks();
        updateProgressDisplay();
        updateBestWeekDisplay();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        updateAchievementsBank();
        
        // 3. ���������, ��� ��� ���������� ���������
        console.log('? ������� �������, ���������� ���������');
        
        showNotification('��� ������� �������! ��� ���������� �����������.', 'success');
        
        // ������������� ��������� � Firebase ����� ������� �������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);
    }
}

// Settings Functions
function toggleSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    const closeBtn = menu.querySelector('.settings-close-btn');
    
    if (menu.classList.contains('show')) {
        // ��������� ����
        closeSettingsMenu();
    } else {
        // ��������� ����
        menu.classList.add('show');
        const btn = document.querySelector('.settings-btn');
        if (btn) btn.setAttribute('aria-expanded', 'true');
        
        // �������� ��������� ������ ��������
        if (closeBtn) {
            closeBtn.style.animation = 'closeBtnAppear 0.5s ease-out';
        }
    }
}

function closeSettingsMenu() {
    const menu = document.getElementById('settingsMenu');
    const closeBtn = menu.querySelector('.settings-close-btn');
    
    // �������� ������������ ������ ��������
    if (closeBtn) {
        closeBtn.style.animation = 'closeBtnDisappear 0.3s ease-in forwards';
    }
    
    // ��������� ���� � ��������� ��������� ��� ��������
    safeSetTimeout(() => {
        menu.classList.remove('show');
        const btn = document.querySelector('.settings-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        
        // ���������� �������� ������
        if (closeBtn) {
            closeBtn.style.animation = '';
        }
    }, 200);
}

// �������� ���� ��� ����� ��� ��� �������
document.addEventListener('click', function(event) {
    const menu = document.getElementById('settingsMenu');
    const settingsBtn = document.querySelector('.settings-btn');
    
    if (menu && menu.classList.contains('show')) {
        // ���� ���� �� �� ������ �������� � �� �� ����
        if (!menu.contains(event.target) && !settingsBtn.contains(event.target)) {
            closeSettingsMenu();
        }
    }
});

// �������� ���� �� ������� Escape
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const menu = document.getElementById('settingsMenu');
        if (menu && menu.classList.contains('show')) {
            closeSettingsMenu();
        }
        

    }
});



function applyStateFromBase64(b64) {
    try {
        const json = decodeURIComponent(escape(atob(b64)));
        const incoming = JSON.parse(json);
        if (!incoming || !incoming.progress || !incoming.tasks) throw new Error('bad payload');
        appState.progress = { ...appState.progress, ...incoming.progress };
        appState.tasks = incoming.tasks || appState.tasks;
        appState.rewards = incoming.rewards || [];
        appState.activityData = incoming.activityData || {};
        appState.rewardPlan = incoming.rewardPlan || { description: '' };
        appState.resetDate = incoming.resetDate ? new Date(incoming.resetDate) : (appState.resetDate || new Date());
        
        // ��������� ��� ������������, ���� ��� ���� � ������������� ������
        if (incoming.userName) {
            appState.userName = incoming.userName;
        }
        
        console.log('?? ������ ������ ��������, ������������� ��� ����������...');
        
        // ������ �������� ���� �����������
        
        // 1. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        updateProgressDisplay();
        renderTasks();
        renderRewards();
        generateCalendar();
        updateDayActivity();
        renderWeeklyChart();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        
        // 3. ������������� ��������� ����������� ������ ������
        updateBestWeekDisplay();
        
        // 4. ���������, ��� ��� ���������� ���������
        console.log('? ������ ������ ��������, ��� ���������� �����������');
        
        // ��������� ����������� ������� ��������
        updateLearningTimeDisplay();
        
        showNotification('��������� ����������������! ��� ���������� �����������.', 'success');
    } catch (e) {
        showNotification('������ ���������� ���������', 'error');
    }
}



function openDriveHelp() {
    alert('Google Drive: ����������� ������� ��� ���������� ����� � ���������� Drive, � ����� �� ������ ���������� � ������, ������ ���� �� Drive. ��� ������-������������� ������ ������.');
}





function exportData() {
    // ��������� ���� ������������
    if (appState.role === 'viewer') {
        showNotification('����� ���������: ������� ������ ����������', 'warning');
        return;
    }
    
    const dataToExport = {
        // �������� ������ ����������
        progress: appState.progress,
        tasks: appState.tasks,
        rewards: appState.rewards,
        activityData: appState.activityData,
        rewardPlan: appState.rewardPlan,
        resetDate: appState.resetDate,
        
        // ���������� � ������������
        user: appState.user,
        userName: appState.userName,
        role: appState.role,
        isVerified: appState.isVerified,
        pinCodes: appState.pinCodes,
        
        // ��������� ����������
        currentMonth: appState.currentMonth,
        selectedDate: appState.selectedDate,
        progressView: appState.progressView,
        
        // ���������� ��������
        exportDate: new Date().toISOString(),
        version: '1.1',
        exportInfo: {
            exportedBy: appState.userName,
            exportRole: appState.role,
            totalTasks: appState.tasks.length,
            totalRewards: appState.rewards.length,
            totalActivityDays: Object.keys(appState.activityData).length,
            currentLevel: appState.progress.level,
            totalXP: appState.progress.totalXP,
            starBank: appState.progress.starBank
        }
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    link.download = `english-learning-backup-${appState.userName}-${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showNotification('������ �������������� �������!', 'success');
    toggleSettingsMenu();
}

// File System Access API: save/load snapshots to a user-selected index file
async function saveToFileIndex() {
    if (!('showSaveFilePicker' in window)) { showNotification('������� �� ������������ ���������� � ����-������', 'error'); return; }
    try {
        const handle = await window.showSaveFilePicker({ suggestedName: 'english-learning-index.json', types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] });
        const existing = await readJsonFromHandle(handle, []);
        const snapshot = buildSnapshot();
        existing.push(snapshot);
        await writeJsonToHandle(handle, existing);
        showNotification('������ �������� � ����-������', 'success');
    } catch (e) {
        // user cancelled or error
    }
}
async function loadFromFileIndex() {
    if (!('showOpenFilePicker' in window)) { showNotification('������� �� ������������ �������� �� ����-�������', 'error'); return; }
    try {
        const [handle] = await window.showOpenFilePicker({ types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }] });
        const list = await readJsonFromHandle(handle, []);
        if (!Array.isArray(list) || list.length === 0) { showNotification('����-������ ����', 'info'); return; }
        renderSnapshotPicker(list, (snap) => { applyImportedSnapshot(snap); hideSnapshotPickerModal(); });
    } catch (e) {
        // cancelled
    }
}
function buildSnapshot() {
    return {
        id: Date.now(),
        title: `������ �� ${new Date().toLocaleString('ru-RU')}`,
        createdAt: new Date().toISOString(),
        data: {
            progress: appState.progress,
            tasks: appState.tasks,
            rewards: appState.rewards,
            activityData: appState.activityData,
            rewardPlan: appState.rewardPlan,
            resetDate: appState.resetDate,
            userName: appState.userName,
            pinCodes: appState.pinCodes,
            version: '1.0'
        }
    };
}
async function readJsonFromHandle(handle, fallback) {
    try { const file = await handle.getFile(); const text = await file.text(); return JSON.parse(text); } catch { return fallback; }
}
async function writeJsonToHandle(handle, obj) {
    const writable = await handle.createWritable();
    await writable.write(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
    await writable.close();
}
function renderSnapshotPicker(list, onPick) {
    const modal = document.getElementById('snapshotPickerModal');
    const box = document.getElementById('snapshotList');
    if (!modal || !box) return;
    box.innerHTML = list.slice().reverse().map(s => `
        <div class=\"reward-card\" style=\"margin-bottom:8px;\">
            <div class=\"rc-top\"><div class=\"reward-title\">${escapeHTML(s.title || ('������ #' + s.id))}</div><div class=\"reward-date-2\">${new Date(s.createdAt).toLocaleString('ru-RU')}</div></div>
            <div style=\"display:flex; gap:8px; justify-content:flex-end; margin-top:6px;\">
                <button class=\"btn btn-secondary\" data-id=\"${s.id}\">??? ��������</button>
                <button class=\"btn btn-primary\" data-apply=\"${s.id}\">? ���������</button>
            </div>
        </div>
    `).join('');
    box.querySelectorAll('[data-apply]').forEach(btn => btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-apply'));
        const found = list.find(x => x.id === id);
        if (found) onPick(found.data);
    }));
    box.querySelectorAll('[data-id]').forEach(btn => btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-id'));
        const found = list.find(x => x.id === id);
        if (found) alert(JSON.stringify(found.data, null, 2));
    }));
    modal.classList.add('show');
}
function hideSnapshotPickerModal() { const m = document.getElementById('snapshotPickerModal'); if (m) m.classList.remove('show'); }
function applyImportedSnapshot(importedData) {
    if (!importedData || !importedData.progress || !importedData.tasks) { showNotification('������������ ������', 'error'); return; }
    appState.progress = { ...appState.progress, ...importedData.progress };
    appState.tasks = importedData.tasks || appState.tasks;
    appState.rewards = importedData.rewards || [];
    appState.activityData = importedData.activityData || {};
    appState.rewardPlan = importedData.rewardPlan || { description: '' };
    appState.resetDate = importedData.resetDate ? new Date(importedData.resetDate) : (appState.resetDate || new Date());
    if (importedData.userName) {
        appState.userName = importedData.userName;
    }
    if (importedData.pinCodes) {
        appState.pinCodes = { ...appState.pinCodes, ...importedData.pinCodes };
    }
    console.log('?? ������ ��������, ������������� ��� ����������...');
    
    // ������ �������� ���� �����������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    renderTasks();
    renderRewards();
    generateCalendar();
    updateDayActivity();
    renderWeeklyChart();
    updateRedeemControls();
    updateBestWeekDisplay();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ������ ��������, ��� ���������� �����������');
    
                            saveState();
            showNotification('������ ��������! ��� ���������� �����������.', 'success');
            
                                // ������������� ��������� � Firebase ����� ���������� ������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);
}



function loadExternalScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script'); s.src = src; s.async = true; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
}

function importData(event) {
    // ��������� ���� ������������
    if (appState.role === 'viewer') {
        showNotification('����� ���������: ������ ������ ����������', 'warning');
        return;
    }
    
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            
            // Validate imported data
            if (!importedData.progress || !importedData.tasks) {
                throw new Error('������������ ������ �����');
            }

            // Restore data
            appState.progress = { ...appState.progress, ...importedData.progress };
            appState.tasks = importedData.tasks || appState.tasks;
            appState.rewards = importedData.rewards || [];
            appState.activityData = importedData.activityData || {};
            appState.rewardPlan = importedData.rewardPlan || { description: "" };
            appState.resetDate = importedData.resetDate ? new Date(importedData.resetDate) : (appState.resetDate || new Date());
            
            // ��������� ��� ������������, ���� ��� ���� � ������������� ������
            if (importedData.userName) {
                appState.userName = importedData.userName;
            }
            
            // ��������� PIN-����, ���� ��� ���� � ������������� ������
            if (importedData.pinCodes) {
                appState.pinCodes = { ...appState.pinCodes, ...importedData.pinCodes };
            }

            console.log('?? ������ ������ ��������, ������������� ��� ����������...');
            
            // ������ �������� ���� �����������
            
            // 1. ������������� ������ ������
            recalculateBestWeek();
            
            // 2. ��������� ��� �����������
            updateProgressDisplay();
            renderTasks();
            renderRewards();
            generateCalendar();
            updateDayActivity();
            renderWeeklyChart();
            updateBestWeekDisplay();
            updateRedeemControls();
            updateProgressWeekSection();
            updateMonthlyProgressSection();
            updateWeeklyStars();
            
            // 3. ���������, ��� ��� ���������� ���������
            console.log('? ������ ������ ��������, ��� ���������� �����������');
            
            // ��������� ����������� ������� ��������
            updateLearningTimeDisplay();
            
            showNotification('������ ������������� �������! ��� ���������� �����������.', 'success');
            
            // ������������� ��������� � Firebase ����� ������� ������
            safeSetTimeout(() => {
                saveDataToFirebaseSilent();
            }, 1000);
            
            saveState();
        } catch (error) {
            showNotification('������ ��� ������� ������: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
    toggleSettingsMenu();
}

function resetProgress() {
    // ��������� ���� ������������
    if (appState.role === 'viewer') {
        showNotification('����� ���������: ����� ��������� ����������', 'warning');
        return;
    }
    
    if (confirm('�� �������, ��� ������ �������� ���� ��������? ��� �������� ������ ��������!')) {
        console.log('?? �������� ������ ����� ���������...');
        
        // ��������� ���������� ��������
        appState.progress = {
            level: 1,
            totalXP: 0,
            currentLevelXP: 0,
            bestWeekXP: 0,
            weeklyXP: 0,
            weeklyStars: 0,
            starBank: 0,
            weekStartKey: getWeekStartKey(new Date()),
            lastCheckedLevel: 0  // ���������� ������� ����������
        };
        
        // ���������� ������� � ���������
        appState.tasks = [
            {
                id: 1,
                name: "�������� ����� ����",
                description: "������� 10 ����� ���������� ����",
                xpReward: 50,
                duration: 15,
                icon: "??",
                category: "vocabulary",
            },
            {
                id: 2,
                name: "�������������� ����������",
                description: "��������� ���������� �� Present Simple",
                xpReward: 75,
                duration: 20,
                icon: "??",
                category: "grammar",
            },
            {
                id: 3,
                name: "�����������",
                description: "���������� ������ � �������� �� �������",
                xpReward: 60,
                duration: 25,
                icon: "??",
                category: "listening",
            }
        ];
        
        // ������� ��� ������� � ����������
        appState.rewards = [];
        appState.activityData = {};
        appState.rewardPlan = { description: "" };
        appState.resetDate = new Date();
        
        // ���������� ��� ������������ � �������� �� ���������
        appState.userName = '������';
        
        // ���������� PIN-����
        appState.pinCodes = {
            '������': null,
            'Admin': null
        };
        
        // ������� ��������� ������
        appState.weeklyData = {};
        
        // ���������� �������������
        appState.progressView = { weekOffset: 0, monthOffset: 0 };
        appState.currentMonth = new Date();
        appState.selectedDate = new Date();

        console.log('?? �������� �������, ��������� ��� ����������...');
        
        // ������ �������� ���� �����������
        
        // 1. ������������� ������ ������ (������ ���� 0)
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        updateProgressDisplay();
        renderTasks();
        renderRewards();
        generateCalendar();
        updateDayActivity();
        renderWeeklyChart();
        
        // 3. ������������� ��������� ����������� ������ ������
        updateBestWeekDisplay();
        
        // 4. ��������� �������� ���������� ���������
        updateRedeemControls();
        
        // 5. ��������� ��������� ������ ���������
        updateProgressWeekSection();
        
        // 6. ��������� �������� ������ ���������
        updateMonthlyProgressSection();
        
        // 7. ��������� ������
        updateWeeklyStars();
        
        // 8. ���������� ������
        ensureWeeklyReset();
        
        // 9. ��������� ����������� ������� ��������
        updateLearningTimeDisplay();
        
        // 10. ���������, ��� ��� ���������� ������������� ��������
        console.log('? �������� ������ �����������:');
        console.log('   - �������:', appState.progress.level);
        console.log('   - ����� XP:', appState.progress.totalXP);
        console.log('   - XP �� ������:', appState.progress.weeklyXP);
        console.log('   - ������ ������:', appState.progress.bestWeekXP);
        console.log('   - ������ �� ������:', appState.progress.weeklyStars);
        console.log('   - ���� �����:', appState.progress.starBank);
        console.log('   - ����������:', Object.keys(appState.activityData).length, '����');
        console.log('   - �������:', appState.rewards.length);
        console.log('   - �������:', appState.tasks.length);

        showNotification('�������� ��������� �������! ��� ���������� ���������.', 'success');
        
        // ������������� ��������� � Firebase ����� ������ ���������
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);
    }
    toggleSettingsMenu();
}

// Close modals and menus on outside click
window.onclick = function (event) {
    const taskModal = document.getElementById("taskModal");
    const editTaskModal = document.getElementById("editTaskModal");
    const rewardModal = document.getElementById("rewardModal");
    const ideaModal = document.getElementById("ideaModal");

    const settingsMenu = document.getElementById("settingsMenu");

    if (event.target === taskModal) {
        hideTaskModal();
    }
    if (event.target === editTaskModal) {
        hideEditTaskModal();
    }
    if (event.target === rewardModal) {
        hideRewardModal();
    }
    if (event.target === ideaModal) {
        hideIdeaModal();
    }


    
    // Close settings menu if clicked outside
    if (!event.target.closest('.settings-panel')) {
        settingsMenu.classList.remove('show');
        const btn = document.querySelector('.settings-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }
};

// Close menus/modals on Esc
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        hideTaskModal();
        hideEditTaskModal();
        hideRewardModal();
        hideIdeaModal();


        const menu = document.getElementById('settingsMenu');
        if (menu) menu.classList.remove('show');
        const btn = document.querySelector('.settings-btn');
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }
});

// Initialize app when page loads (removed duplicate)










function getBestWeekData() {
    const state = getEffectiveState();
    const weeklyData = state.weeklyData || {};
    
    let bestWeek = { xp: 0, date: '�', tasks: '�' };
    
    // ��������� ������������ ������
    Object.keys(weeklyData).forEach(weekKey => {
        const week = weeklyData[weekKey];
        if (week.xp > bestWeek.xp) {
            bestWeek = {
                xp: week.xp,
                date: weekKey,
                tasks: week.tasks || '�'
            };
        }
    });
    
    // ��������� ������� ������
    const currentWeekXP = state.progress.weeklyXP || 0;
    if (currentWeekXP > bestWeek.xp) {
        bestWeek = {
            xp: currentWeekXP,
            date: '������� ������',
            tasks: '�'
        };
    }
    
    console.log('?? ������ ������ ������:', bestWeek, '������� ������:', currentWeekXP);
    return bestWeek;
}

function updateBestWeekProgress() {
    const state = getEffectiveState();
    const currentWeekXP = state.progress.weeklyXP || 0;
    const currentBestWeek = state.progress.bestWeekXP || 0;
    
    console.log('?? �������� ������ ������:', { currentWeekXP, currentBestWeek });
    
    if (currentWeekXP > currentBestWeek) {
        state.progress.bestWeekXP = currentWeekXP;
        console.log('?? ����� ������ ������!', currentWeekXP, 'XP');
        
        console.log('?? ����� ������ ������, ������������� ��� ����������...');
        
        // ������ �������� ���� ����������� ��� ����� ������ ������
        
        // 1. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        updateProgressDisplay();
        updateBestWeekDisplay();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        
        // 3. ���������, ��� ��� ���������� ���������
        console.log('? ����� ������ ������, ��� ���������� �����������');
        
        // ��������� ��������� ��� ���������� ������ ������
        saveState();
        
        // �������������� ���������� ��������� ��� ��������� ������ ������ ��� �������������
        // saveDataToFirebase();
    } else {
        console.log('?? ������� ������ �� ��������� ������:', currentWeekXP, '<=', currentBestWeek);
        
        // ������ ������������� ������ ������ ��� ������������
        recalculateBestWeek();
        
        // ������������� ��������� ����������� ������ ������
        updateBestWeekDisplay();
    }
}

// ������� ��� ��������� ������ ������ �� ������ ���� ������
function recalculateBestWeek() {
    const state = getEffectiveState();
    console.log('?? ������������� ������ ������...');
    
    // �������� ������� XP �� ������
    const currentWeekXP = state.progress.weeklyXP || 0;
    
    // ��������� XP �� ������� �� ������ activityData
    const weeklyData = {};
    const activityData = state.activityData || {};
    
    // ���������� ���������� �� �������
    Object.keys(activityData).forEach(dateStr => {
        const logs = activityData[dateStr];
        if (Array.isArray(logs)) {
            const weekKey = getWeekStartKey(new Date(dateStr));
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = { xp: 0, tasks: 0 };
            }
            
            const dayXP = logs.reduce((sum, log) => sum + (log.xpEarned || 0), 0);
            weeklyData[weekKey].xp += dayXP;
            weeklyData[weekKey].tasks += logs.length;
        }
    });
    
    // ��������� ��������� ������ ��� ������������� � ������ ������
    state.weeklyData = weeklyData;
    
    let maxWeekXP = 0;
    let bestWeekKey = '';
    
    // ��������� ������������ ������
    Object.keys(weeklyData).forEach(weekKey => {
        const week = weeklyData[weekKey];
        if (week.xp > maxWeekXP) {
            maxWeekXP = week.xp;
            bestWeekKey = weekKey;
        }
    });
    
    // ��������� ������� ������
    if (currentWeekXP > maxWeekXP) {
        maxWeekXP = currentWeekXP;
        bestWeekKey = 'current';
    }
    
    // ��������� ������ ������
    const oldBestWeek = state.progress.bestWeekXP || 0;
    state.progress.bestWeekXP = maxWeekXP;
    
    console.log('?? �������� ������ ������:', {
        old: oldBestWeek,
        new: maxWeekXP,
        currentWeekXP: currentWeekXP,
        bestWeek: bestWeekKey,
        weeklyData: weeklyData,
        historical: Object.keys(weeklyData).length
    });
    
    // ���� �������� ����������, ������������� ��� ����������
    if (oldBestWeek !== maxWeekXP) {
        console.log('?? ������ ������ ����������, ������������� ��� ����������...');
        
        // ������ �������� ���� ����������� ��� ��������� ������ ������
        
        // 1. ��������� ��� �����������
        updateProgressDisplay();
        updateBestWeekDisplay();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        
        // 2. ���������, ��� ��� ���������� ���������
        console.log('? ������ ������ ���������, ��� ���������� �����������');
        
        // ��������� ���������
        saveState();
        console.log('?? ��������� ��������� ����� ��������� ������ ������');
        
        // �������������� ���������� ��������� ��� ��������� ������ ������ ��� �������������
        // saveDataToFirebase();
    }
    
    return maxWeekXP;
}



















// Function to check for new achievements
function checkForNewAchievements() {
    const state = getEffectiveState();
    const currentLevel = state.progress.level;
    
    // Get last checked level from state
    const lastCheckedLevel = state.progress.lastCheckedLevel || 0;
    
    console.log('?? checkForNewAchievements called:', {
        currentLevel,
        lastCheckedLevel,
        hasNewLevel: currentLevel > lastCheckedLevel,
        totalXP: state.progress.totalXP
    });
    

    
    // Check if we have a new level
    if (currentLevel > lastCheckedLevel) {
        console.log('?? ����� ������� ���������! ���� ����������...');
        
        // Achievement notification removed
        console.log('?? ���������� ������� ��� ������:', currentLevel, '�� ����������� ���������');
        
        // Update last checked level
        state.progress.lastCheckedLevel = currentLevel;
        console.log('?? �������� lastCheckedLevel ��:', currentLevel);
    } else {
        console.log('?? ����� ������� �� ����������');
    }
}

// Function to get achievement for specific level
function getAchievementForLevel(level) {
    const achievements = [
        // ������ 1-5 (������ �������)
        { level: 1, title: '?? ������ ����', description: '������� � �������� ����������� �����. ������ �������������� �����������!', icon: '??' },
        { level: 2, title: '?? ������', description: '���������� ������ ����������� �����. ������ ���� �������� ����� ������!', icon: '??' },
        { level: 3, title: '?? ����������������', description: '����������� ���������� �������� � �������� �����. ����������� � ��� �� ����!', icon: '??' },
        { level: 4, title: '?? �������', description: '�������������� ������������� � �������� �����������. ��������� �� �������� ���� �����!', icon: '??' },
        { level: 5, title: '? ��������� �������', description: '���������� ������ ���������! ������ �� �������� ���������� ���� � ������� �����.', icon: '?' },
        
        // ������ ������ 5 (10, 15, 20, 25...)
        { level: 10, title: '?? �������� ���������', description: '�������� 10 ������! ��� ���������� ���������� ��� ����� ���������.', icon: '??' },
        { level: 15, title: '?? ��������� ������������', description: '15 ������� �������! �� ������ �������� �������� �� ������� ����.', icon: '??' },
        { level: 20, title: '?? ����������� ������', description: '20 �������! ���� ������ ����������� ����� ���������� ��������� � ��������.', icon: '??' },
        { level: 25, title: '?? ������� ������', description: '�������� ���� ��������! �� �������� ���������� �� ������� ������.', icon: '??' },
        { level: 30, title: '?? ������ �����', description: '30 �������! ��� ���������� ��������� �������� �������� �����.', icon: '??' },
        { level: 35, title: '?? ��������������� ������', description: '35 �������! �� �������� ������ � �������������� ���������.', icon: '??' },
        { level: 40, title: '?? �������� �����', description: '40 �������! ���� ��������� ����������� ����� �������� ��������.', icon: '??' },
        { level: 45, title: '?? ������ �����������', description: '45 �������! �� �������� ����� � �������� �����.', icon: '??' },
        { level: 50, title: '?? �������� ���� � ������������', description: '50 �������! �������� ���� ��������. �� �� ���������� ���� � ����������!', icon: '??' },
        { level: 55, title: '?? ������ �����������', description: '55 �������! ���� ������ ����������� ����� ����.', icon: '??' },
        { level: 60, title: '?? ������� �����', description: '60 �������! �� ��������� � ���� ������ ������.', icon: '??' },
        { level: 65, title: '? ������ � ��������', description: '65 �������! ��� �������� ����������� � ����������.', icon: '?' },
        { level: 70, title: '?? �������� ������', description: '70 �������! ���� �������� ������ ������ �������� � �����������.', icon: '??' },
        { level: 75, title: '?? �������� �����', description: '75 �������! �� �������� ������� �� ���������� ����.', icon: '??' },
        { level: 80, title: '?? ������� �����������', description: '80 �������! �� ������� � �������� ����������� �����.', icon: '??' },
        { level: 85, title: '?? ������� �����', description: '85 �������! ���� �������� ���������� ���������.', icon: '??' },
        { level: 90, title: '?? ��������� �����������', description: '90 �������! �� ������� ����� ����������� �����.', icon: '??' },
        { level: 95, title: '?? ������������ ������', description: '95 �������! ���� ���� ����������� ������� � �����.', icon: '??' },
        { level: 100, title: '?? ������������ �������', description: '100 �������! �� �������� ������������� ���������� � ���������� �����!', icon: '??' }
    ];
    
    return achievements.find(a => a.level === level);
}

// Function to update achievements bank
function updateAchievementsBank() {
    console.log('?? updateAchievementsBank called');
    const container = document.getElementById('achievementsBankContent');
    const state = getEffectiveState();
    const currentLevel = state.progress.level;
    
    console.log('Container element:', container);
    console.log('Current level:', currentLevel);
    
    if (!container) {
        console.log('? Container not found!');
        return;
    }
    
    // Get all achievements
    const allAchievements = [
        // ������ 1-5 (������ �������)
        { level: 1, title: '?? ������ ����', description: '������� � �������� ����������� �����. ������ �������������� �����������!', icon: '??' },
        { level: 2, title: '?? ������', description: '���������� ������ ����������� �����. ������ ���� �������� ����� ������!', icon: '??' },
        { level: 3, title: '?? ����������������', description: '����������� ���������� �������� � �������� �����. ����������� � ��� �� ����!', icon: '??' },
        { level: 4, title: '?? �������', description: '�������������� ������������� � �������� �����������. ��������� �� �������� ���� �����!', icon: '??' },
        { level: 5, title: '? ��������� �������', description: '���������� ������ ���������! ������ �� �������� ���������� ���� � ������� �����.', icon: '?' },
        
        // ������ ������ 5 (10, 15, 20, 25...)
        { level: 10, title: '?? �������� ���������', description: '�������� 10 ������! ��� ���������� ���������� ��� ����� ���������.', icon: '??' },
        { level: 15, title: '?? ��������� ������������', description: '15 ������� �������! �� ������ �������� �������� �� ������� ����.', icon: '??' },
        { level: 20, title: '?? ����������� ������', description: '20 �������! ���� ������ ����������� ����� ���������� ��������� � ��������.', icon: '??' },
        { level: 25, title: '?? ������� ������', description: '�������� ���� ��������! �� �������� ���������� �� ������� ������.', icon: '??' },
        { level: 30, title: '?? ������ �����', description: '30 �������! ��� ���������� ��������� �������� �������� �����.', icon: '??' },
        { level: 35, title: '?? ��������������� ������', description: '35 �������! �� �������� ������ � �������������� ���������.', icon: '??' },
        { level: 40, title: '?? �������� �����', description: '40 �������! ���� ��������� ����������� ����� �������� ��������.', icon: '??' },
        { level: 45, title: '?? ������ �����������', description: '45 �������! �� �������� ����� � �������� �����.', icon: '??' },
        { level: 50, title: '?? �������� ���� � ������������', description: '50 �������! �������� ���� ��������. �� �� ���������� ���� � ����������!', icon: '??' },
        { level: 55, title: '?? ������ �����������', description: '55 �������! ���� ������ ����������� ����� ����.', icon: '??' },
        { level: 60, title: '?? ������� �����', description: '60 �������! �� ��������� � ���� ������ ������.', icon: '??' },
        { level: 65, title: '? ������ � ��������', description: '65 �������! ��� �������� ����������� � ����������.', icon: '?' },
        { level: 70, title: '?? �������� ������', description: '70 �������! ���� �������� ������ ������ �������� � �����������.', icon: '??' },
        { level: 75, title: '?? �������� �����', description: '75 �������! �� �������� ������� �� ���������� ����.', icon: '??' },
        { level: 80, title: '?? ������� �����������', description: '80 �������! �� ������� � �������� ����������� �����.', icon: '??' },
        { level: 85, title: '?? ������� �����', description: '85 �������! ���� �������� ���������� ���������.', icon: '??' },
        { level: 90, title: '?? ��������� �����������', description: '90 �������! �� ������� ����� ����������� �����.', icon: '??' },
        { level: 95, title: '?? ������������ ������', description: '95 �������! ���� ���� ����������� ������� � �����.', icon: '??' },
        { level: 100, title: '?? ������������ �������', description: '100 �������! �� �������� ������������� ���������� � ���������� �����!', icon: '??' }
    ];
    
    // Calculate statistics
    const achievedCount = allAchievements.filter(a => currentLevel >= a.level).length;
    const progressPercent = Math.round((currentLevel / 100) * 100);
    const currentStatus = getCurrentAchievementStatus(currentLevel);
    
    // Update summary
    document.getElementById('achievementsUnlocked').textContent = achievedCount;
    document.getElementById('achievementsProgress').textContent = `${progressPercent}%`;
    document.getElementById('currentAchievementLevel').textContent = currentStatus;
    
    // Render all achievements
    container.innerHTML = allAchievements.map(achievement => {
        const achieved = currentLevel >= achievement.level;
        return `
            <div class="achievement-bank-item ${achieved ? 'achieved' : 'locked'}">
                <div class="achievement-bank-icon">${achievement.icon}</div>
                <div class="achievement-bank-content">
                    <div class="achievement-bank-title">${achievement.title}</div>
                    <div class="achievement-bank-level">������� ${achievement.level}</div>
                    <div class="achievement-bank-description">${achievement.description}</div>
                </div>
                <div class="achievement-bank-status">
                    ${achieved ? 
                        '<span class="achievement-bank-status-achieved">? ��������</span>' : 
                        `<span class="achievement-bank-status-locked">?? ${currentLevel}/${achievement.level}</span>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

// Function to get current achievement status
function getCurrentAchievementStatus(level) {
    if (level >= 100) return '������������';
    if (level >= 90) return '���������';
    if (level >= 80) return '�������';
    if (level >= 70) return '������';
    if (level >= 60) return '�������';
    if (level >= 50) return '�����������';
    if (level >= 40) return '�������';
    if (level >= 30) return '���������';
    if (level >= 20) return '�������������';
    if (level >= 10) return '��������';
    if (level >= 5) return '��������� �������';
    if (level >= 1) return '�������';
    return '����������';
}

// Achievements Bank Panel Functions
let currentSelectedLevel = 1;
let achievementsBankExpanded = false;

function toggleAchievementsBank() {
    console.log('?? toggleAchievementsBank called');
    const content = document.getElementById('achievementsBankPanelContent');
    const toggle = document.getElementById('achievementsBankToggle');
    
    console.log('Content element:', content);
    console.log('Toggle element:', toggle);
    console.log('Current expanded state:', achievementsBankExpanded);
    
    if (achievementsBankExpanded) {
        content.style.display = 'none';
        toggle.classList.remove('expanded');
        achievementsBankExpanded = false;
        console.log('?? Bank collapsed');
    } else {
        // Update achievements bank content
        console.log('?? Updating achievements bank content...');
        updateAchievementsBank();
        
        content.style.display = 'block';
        toggle.classList.add('expanded');
        achievementsBankExpanded = true;
        console.log('?? Bank expanded');
    }
}

// Rewards Bank Panel Functions
let rewardsBankExpanded = false;

function toggleRewardsBank() {
    console.log('?? toggleRewardsBank called');
    const content = document.getElementById('rewardsBankPanelContent');
    const toggle = document.getElementById('rewardsBankToggle');
    
    console.log('Content element:', content);
    console.log('Toggle element:', toggle);
    console.log('Current expanded state:', rewardsBankExpanded);
    
    if (rewardsBankExpanded) {
        content.style.display = 'none';
        toggle.classList.remove('expanded');
        rewardsBankExpanded = false;
        console.log('?? Rewards bank collapsed');
    } else {
        // Update rewards bank content
        console.log('?? Updating rewards bank content...');
        updateRewardsBank();
        
        content.style.display = 'block';
        toggle.classList.add('expanded');
        rewardsBankExpanded = true;
        console.log('?? Rewards bank expanded');
        
        // ���������� ���������� ����� �������� ������
        safeSetTimeout(() => {
            const container = document.getElementById('rewardsBankContent');
            if (container) {
                console.log('After panel opened:', {
                    containerVisible: container.offsetParent !== null,
                    containerScrollHeight: container.scrollHeight,
                    containerClientHeight: container.clientHeight,
                    containerMaxHeight: window.getComputedStyle(container).maxHeight,
                    shouldShowScroll: container.scrollHeight > container.clientHeight
                });
            }
        }, 100);
    }
}



// Simple test function to check if notifications work at all
function testSimpleNotification() {
    console.log('?? ������� ���� �����������...');
    
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 99999;
        background: red;
        color: white;
        padding: 20px;
        border-radius: 10px;
        font-size: 20px;
        font-weight: bold;
    `;
    notification.textContent = '���� �����������';
    
    document.body.appendChild(notification);
    console.log('?? ������� ����������� ��������� � DOM');
    
    // Remove after 3 seconds
    safeSetTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
            console.log('?? ������� ����������� �������');
        }
    }, 3000);
}



// Test function to simulate task completion and star earning
function testTaskCompletionWithStar() {
    console.log('?? ��������� ���������� ������� � ���������� ������...');
    
    // Simulate earning enough XP for a star
    const testXP = 500; // Enough for 1 star
    appState.progress.weeklyXP = testXP;
    
    console.log('? ������������� ��������� ������...');
    updateWeeklyStars();
}



// Test function to simulate level up and achievement
function testLevelUpAchievement() {
    console.log('?? ��������� ��������� ������ � ����������...');
    
    // Simulate level up
    const oldLevel = appState.progress.level;
    appState.progress.level = 2;
    appState.progress.lastCheckedLevel = oldLevel;
    
    console.log('?? ��������� ����� ����������...');
    checkForNewAchievements();
}

// Test function to check achievement modal visibility
function testAchievementModalVisibility() {
    console.log('?? ���� ��������� ���������� ���� ����������');
    console.log('==========================================');
    
    // ������� �������� ��������� ����
    const modalContent = `
        <div class="achievement-modal-overlay" id="testAchievementModal">
            <div class="achievement-modal-content">
                <div class="achievement-modal-header">
                    <div class="achievement-modal-icon">??</div>
                    <h2 class="achievement-modal-title">���� ���������</h2>
                </div>
                <div class="achievement-modal-body">
                    <div class="achievement-modal-achievement">
                        <div class="achievement-modal-achievement-icon">??</div>
                        <div class="achievement-modal-achievement-title">�������� ����������</div>
                        <div class="achievement-modal-achievement-level">������� 1 ���������!</div>
                        <div class="achievement-modal-achievement-description">��� ���� ��������� ���������� ����</div>
                    </div>
                </div>
                <div class="achievement-modal-footer">
                    <button class="btn btn-primary" onclick="hideTestAchievementModal()">
                        �������! ??
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalContent);
    console.log('?? �������� ��������� ���� ��������� � DOM');
    
    // ��������� ����� show
    safeSetTimeout(() => {
        const modal = document.getElementById('testAchievementModal');
        if (modal) {
            modal.classList.add('show');
            console.log('?? ����� show �������� � ���������� ����');
            
            // ��������� computed styles
            const computedStyle = window.getComputedStyle(modal);
            console.log('?? Computed styles:', {
                position: computedStyle.position,
                zIndex: computedStyle.zIndex,
                opacity: computedStyle.opacity,
                visibility: computedStyle.visibility,
                display: computedStyle.display
            });
        } else {
            console.log('?? ������: ��������� ���� �� �������!');
        }
    }, 100);
}

// Function to hide test achievement modal
function hideTestAchievementModal() {
    const modal = document.getElementById('testAchievementModal');
    if (modal) {
        modal.classList.remove('show');
        safeSetTimeout(() => {
            modal.remove();
            console.log('?? �������� ��������� ���� �������');
        }, 300);
    }
}

// Function to fix achievements HTML
function fixAchievementsHTML() {
    console.log('?? ���������� HTML ����������...');
    
    const container = document.getElementById('achievementsBankContent');
    if (!container) {
        console.log('? Container not found!');
        return;
    }
    
    // Clear container completely
    container.innerHTML = '';
    
    // Re-render achievements
    updateAchievementsBank();
    
    console.log('?? HTML ���������� ���������');
}

// Function to force open rewards panel
function forceOpenRewardsPanel() {
    console.log('?? ������������� ��������� ������ ������...');
    
    const content = document.getElementById('rewardsBankPanelContent');
    const toggle = document.getElementById('rewardsBankToggle');
    
    if (content && toggle) {
        content.style.display = 'block';
        toggle.classList.add('expanded');
        rewardsBankExpanded = true;
        
        // Update content
        updateRewardsBank();
        
        console.log('?? ������ ������ ������������� �������');
    } else {
        console.log('? �������� ������ ������ �� �������');
    }
}

// Test function to check achievements HTML generation
function testAchievementsHTML() {
    console.log('?? ���� ��������� HTML ����������');
    console.log('==================================');
    
    const container = document.getElementById('achievementsBankContent');
    if (!container) {
        console.log('? Container not found!');
        return;
    }
    
    // Test HTML generation
    const testAchievement = {
        level: 1,
        title: '?? ������ ����',
        description: '������� � �������� ����������� �����.',
        icon: '??'
    };
    
    const testHTML = `
        <div class="achievement-bank-item achieved">
            <div class="achievement-bank-icon">${testAchievement.icon}</div>
            <div class="achievement-bank-content">
                <div class="achievement-bank-title">${testAchievement.title}</div>
                <div class="achievement-bank-level">������� ${testAchievement.level}</div>
                <div class="achievement-bank-description">${testAchievement.description}</div>
            </div>
            <div class="achievement-bank-status">
                <span class="achievement-bank-status-achieved">? ��������</span>
            </div>
        </div>
    `;
    
    console.log('Test HTML:', testHTML);
    
    // Clear container and add test HTML
    container.innerHTML = testHTML;
    
    console.log('Container innerHTML after test:', container.innerHTML);
    
    // Check for "flex" text
    if (container.innerHTML.includes('flex')) {
        console.log('? Found "flex" text in HTML!');
    } else {
        console.log('? No "flex" text found in HTML');
    }
}

// Test function to check rewards panel
function testRewardsPanel() {
    console.log('?? ���� ������ ������');
    console.log('====================');
    
    const content = document.getElementById('rewardsBankPanelContent');
    const toggle = document.getElementById('rewardsBankToggle');
    
    console.log('Content element:', content);
    console.log('Toggle element:', toggle);
    console.log('Current display style:', content ? content.style.display : 'element not found');
    console.log('Current expanded state:', rewardsBankExpanded);
    
    if (content) {
        const computedStyle = window.getComputedStyle(content);
        console.log('Computed display:', computedStyle.display);
        console.log('Computed visibility:', computedStyle.visibility);
    }
    
    // Test toggle
    console.log('?? ��������� ������������...');
    toggleRewardsBank();
    
    safeSetTimeout(() => {
        console.log('After toggle - display style:', content.style.display);
        console.log('After toggle - expanded state:', rewardsBankExpanded);
    }, 100);
}

// Test function to check notification visibility
function testNotificationVisibility() {
    console.log('?? ���� ��������� �����������');
    console.log('================================');
    
    // 1. ��������� CSS �����
    const testDiv = document.createElement('div');
    testDiv.style.cssText = `
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 99999 !important;
        background: red !important;
        color: white !important;
        padding: 20px !important;
        border-radius: 10px !important;
        font-size: 18px !important;
        font-weight: bold !important;
        pointer-events: auto !important;
    `;
    testDiv.textContent = '���� ��������� - ������ �� �� ���?';
    testDiv.id = 'visibilityTest';
    
    document.body.appendChild(testDiv);
    console.log('?? �������� ������� �������� � DOM');
    
    // ��������� computed styles
    const computedStyle = window.getComputedStyle(testDiv);
    console.log('?? Computed styles:', {
        position: computedStyle.position,
        zIndex: computedStyle.zIndex,
        opacity: computedStyle.opacity,
        transform: computedStyle.transform,
        pointerEvents: computedStyle.pointerEvents
    });
    
    // ������� ����� 5 ������
    safeSetTimeout(() => {
        if (testDiv.parentNode) {
            testDiv.parentNode.removeChild(testDiv);
            console.log('?? �������� ������� ������');
        }
    }, 5000);
}

// Test function to verify star system across all weeks
function testStarSystemComprehensive() {
    console.log('? ���� ������� ����� - ������ ��������');
    console.log('=====================================');
    
    // 1. ��������� ������� ���������
    console.log('?? ������� ���������:');
    console.log('- ����� XP:', appState.progress.totalXP);
    console.log('- ������� �������:', appState.progress.level);
    console.log('- ��������� XP:', appState.progress.weeklyXP);
    console.log('- ������ �� ������:', appState.progress.weeklyStars);
    console.log('- ���� �����:', appState.progress.starBank);
    
    // 2. ��������� ������ �� �������
    console.log('?? ������ �� �������:');
    if (appState.weeklyData) {
        for (const [weekKey, weekData] of Object.entries(appState.weeklyData)) {
            const stars = calculateWeeklyStars(weekData.xp);
            console.log(`- ${weekKey}: ${weekData.xp} XP, ${stars} �����`);
        }
    } else {
        console.log('- ��� ������ �� �������');
    }
    
    // 3. ��������� ����������
    console.log('?? ����������:');
    const dates = Object.keys(appState.activityData).sort();
    console.log('- ����� ���� � �����������:', dates.length);
    for (const date of dates.slice(0, 5)) { // ���������� ������ 5 ����
        const logs = appState.activityData[date];
        const dayXP = logs.reduce((sum, log) => sum + (log.xpEarned || 0), 0);
        const weekKey = getWeekStartKey(new Date(date));
        console.log(`  ${date}: ${dayXP} XP (������: ${weekKey})`);
    }
    
    // 4. ��������� �������
    console.log('?? �������:');
    console.log('- ����� ������:', appState.rewards.length);
    const totalStarsSpent = appState.rewards.reduce((sum, reward) => sum + (reward.starsUsed || 0), 0);
    console.log('- ����� ���������:', totalStarsSpent);
    
    // 5. ������������� ���
    console.log('?? ��������� ������ ��������...');
    recalculateAllProgress();
    
    // 6. ��������� ���������
    console.log('? ��������� ���������:');
    console.log('- ����� XP:', appState.progress.totalXP);
    console.log('- ������� �������:', appState.progress.level);
    console.log('- ��������� XP:', appState.progress.weeklyXP);
    console.log('- ������ �� ������:', appState.progress.weeklyStars);
    console.log('- ���� �����:', appState.progress.starBank);
    
    console.log('=====================================');
    console.log('? ���� ��������');
}



// Function to delete a reward (admin only)
function deleteReward(rewardId) {
    // Check if user is admin
    if (appState.role !== 'admin') {
        showNotification('������ ������������� ����� ������� �������', 'error');
        return;
    }
    
    // Find the reward
    const rewardIndex = appState.rewards.findIndex(r => r.id === rewardId);
    if (rewardIndex === -1) {
        showNotification('������� �� �������', 'error');
        return;
    }
    
    const reward = appState.rewards[rewardIndex];
    
    // Show confirmation dialog
    const confirmMessage = `������� ������� "${reward.description}"?\n\n��� �������� ������ ��������.`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Store stars that will be returned
    const starsReturned = reward.starsUsed || 0;
    
    // Remove reward from array
    appState.rewards.splice(rewardIndex, 1);
    
    console.log('??? ������� �������:', reward);
    console.log('? ����� ���������� � ����:', starsReturned);
    
    // Recalculate all progress
    recalculateAllProgress();
    
    // Update all displays
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    updateLearningTimeDisplay();
    
    // Update rewards bank
    updateRewardsBank();
    
    // Update achievements bank
    updateAchievementsBank();
    
    // Show success notification
    showNotification(`������� "${reward.description}" �������! ${starsReturned} ? ���������� � ����. ��� ���������� �����������.`, 'success');
    
    // Auto-save to Firebase
    safeSetTimeout(() => {
        saveDataToFirebaseSilent();
    }, 1000);
}

// ����������� ��� iPhone: ����������������� ����������� ������� ��� ����� ����������
if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
    const achievementItems = container.querySelectorAll('.achievement-bank-item');
    achievementItems.forEach(item => {
        item.style.position = 'relative';
        item.style.zIndex = '1';
        item.style.pointerEvents = 'auto';
        
        const buttons = item.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.style.position = 'relative';
            btn.style.zIndex = '2';
            btn.style.pointerEvents = 'auto';
        });
    });
}

function updateRewardsBank() {
    console.log('?? updateRewardsBank called');
    const container = document.getElementById('rewardsBankContent');
    const state = getEffectiveState();
    const rewards = state.rewards || [];
    
    console.log('Container element:', container);
    console.log('Rewards count:', rewards.length);
    console.log('Sample reward:', rewards[0]);
    
    if (container) {
        console.log('Container computed styles:', {
            maxHeight: window.getComputedStyle(container).maxHeight,
            height: window.getComputedStyle(container).height,
            overflowY: window.getComputedStyle(container).overflowY,
            scrollHeight: container.scrollHeight,
            clientHeight: container.clientHeight
        });
    }
    
    if (!container) {
        console.log('? Rewards container not found!');
        return;
    }
    
    // Calculate statistics
    const rewardsCount = rewards.length;
    const totalStarsSpent = rewards.reduce((sum, reward) => sum + (reward.starsUsed || 0), 0);
    const lastRewardDate = rewards.length > 0 ? 
        (() => {
            const date = new Date(rewards[rewards.length - 1].redeemedAt);
            return isNaN(date.getTime()) ? '�' : 
                date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit'
                });
        })() : '�';
    
    // Update summary
    document.getElementById('rewardsReceived').textContent = rewardsCount;
    document.getElementById('totalStarsSpent').textContent = totalStarsSpent;
    document.getElementById('lastRewardDate').textContent = lastRewardDate;
    
    // Render rewards
    if (rewards.length === 0) {
        container.innerHTML = `
            <div class="rewards-bank-empty">
                <div class="rewards-bank-empty-icon">??</div>
                <div class="rewards-bank-empty-title">���� ��� ���������� ������</div>
                <div class="rewards-bank-empty-description">
                    ���������� ������� � �������� �, ������� ���������� ����!
                </div>
            </div>
        `;
        return;
    }
    
    // Sort rewards by date (newest first)
    const sortedRewards = rewards.sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
    
    container.innerHTML = sortedRewards.map(reward => {
        const date = new Date(reward.redeemedAt);
        const formattedDate = isNaN(date.getTime()) ? '���� ����������' : 
            date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        
        return `
            <div class="reward-bank-item">
                <div class="reward-bank-icon">${reward.icon || '??'}</div>
                <div class="reward-bank-content">
                    <div class="reward-bank-title">${reward.description}</div>
                    <div class="reward-bank-description">������� ��������</div>
                    <div class="reward-bank-meta">
                        <div class="reward-bank-date">${formattedDate}</div>
                        <div class="reward-bank-stars">${reward.starsUsed} ?</div>
                    </div>
                </div>
                ${appState.role === 'admin' ? `
                    <div class="reward-bank-actions">
                        <button class="reward-delete-btn" onclick="deleteReward(${reward.id})" title="������� �������">
                            ???
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // ���������� ���������� ����� ����������
    console.log('After rendering rewards:', {
        rewardsCount: sortedRewards.length,
        containerScrollHeight: container.scrollHeight,
        containerClientHeight: container.clientHeight,
        containerMaxHeight: window.getComputedStyle(container).maxHeight,
        shouldShowScroll: container.scrollHeight > container.clientHeight
    });
    
    // ����������� ��� iPhone: ����������������� ����������� ������� ��� ����� ������
    if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
        const rewardItems = container.querySelectorAll('.reward-bank-item');
        rewardItems.forEach(item => {
            item.style.position = 'relative';
            item.style.zIndex = '1';
            item.style.pointerEvents = 'auto';
            
            const buttons = item.querySelectorAll('button');
            buttons.forEach(btn => {
                btn.style.position = 'relative';
                btn.style.zIndex = '2';
                btn.style.pointerEvents = 'auto';
            });
        });
    }
}

function changeAchievementLevel(direction) {
    const newLevel = currentSelectedLevel + direction;
    if (newLevel >= 1 && newLevel <= 100) {
        updateAchievementLevel(newLevel);
    }
}

function updateAchievementLevel(level) {
    currentSelectedLevel = parseInt(level);
    
    // Update level display
    document.getElementById('selectedLevelNumber').textContent = currentSelectedLevel;
    document.getElementById('levelRangeSlider').value = currentSelectedLevel;
    
    // Update navigation buttons
    document.getElementById('prevLevelBtn').disabled = currentSelectedLevel <= 1;
    document.getElementById('nextLevelBtn').disabled = currentSelectedLevel >= 100;
    
    // Get achievement for this level
    const achievement = getAchievementForLevel(currentSelectedLevel);
    const state = getEffectiveState();
    const currentLevel = state.progress.level;
    
    // Update achievement display
    const displayContainer = document.getElementById('achievementDisplay');
    const progressInfo = document.getElementById('achievementProgressInfo');
    
    if (achievement) {
        const isAchieved = currentLevel >= currentSelectedLevel;
        
        displayContainer.innerHTML = `
            <div class="achievement-display-icon">${achievement.icon}</div>
            <div class="achievement-display-title">${achievement.title}</div>
            <div class="achievement-display-description">${achievement.description}</div>
        `;
        
        // Update progress info
        if (isAchieved) {
            progressInfo.innerHTML = `
                <h5>? ���������� ��������!</h5>
                <p>�� �������� ${currentSelectedLevel} ������ � �������� ��� ����������.</p>
            `;
        } else {
            const xpNeeded = (currentSelectedLevel - 1) * 810;
            const currentXP = state.progress.totalXP;
            const xpRemaining = Math.max(0, xpNeeded - currentXP);
            
            progressInfo.innerHTML = `
                <h5>?? ���������� �������������</h5>
                <p>��� ��������� ����� ���������� ����� ������� ${currentSelectedLevel} ������.</p>
                <p>�������� �������: <strong>${xpRemaining} XP</strong></p>
            `;
        }
    } else {
        displayContainer.innerHTML = `
            <div class="achievement-display-icon">?</div>
            <div class="achievement-display-title">���������� �� �������</div>
            <div class="achievement-display-description">��� ����� ������ ���� ��� ������������ ����������.</div>
        `;
        
        progressInfo.innerHTML = `
            <h5>?? ������� �������</h5>
            <p>���� ������� �� ����� ������������ ����������, �� �������� ������ ������ ������ ���������.</p>
        `;
    }
}

function updateMilestones() {
    const container = document.getElementById('milestonesContent');
    const state = getEffectiveState();
    const currentLevel = state.progress.level;
    
    // ������� ������ ���������� �� ������ ������� �������� ����������� �����
    const achievements = [
        // ������ 1-5 (������ �������)
        { level: 1, achieved: currentLevel >= 1, title: '?? ������ ����', description: '������� � �������� ����������� �����. ������ �������������� �����������!' },
        { level: 2, achieved: currentLevel >= 2, title: '?? ������', description: '���������� ������ ����������� �����. ������ ���� �������� ����� ������!' },
        { level: 3, achieved: currentLevel >= 3, title: '?? ����������������', description: '����������� ���������� �������� � �������� �����. ����������� � ��� �� ����!' },
        { level: 4, achieved: currentLevel >= 4, title: '?? �������', description: '�������������� ������������� � �������� �����������. ��������� �� �������� ���� �����!' },
        { level: 5, achieved: currentLevel >= 5, title: '? ��������� �������', description: '���������� ������ ���������! ������ �� �������� ���������� ���� � ������� �����.' },
        
        // ������ ������ 5 (10, 15, 20, 25...)
        { level: 10, achieved: currentLevel >= 10, title: '?? �������� ���������', description: '�������� 10 ������! ��� ���������� ���������� ��� ����� ���������.' },
        { level: 15, achieved: currentLevel >= 15, title: '?? ��������� ������������', description: '15 ������� �������! �� ������ �������� �������� �� ������� ����.' },
        { level: 20, achieved: currentLevel >= 20, title: '?? ����������� ������', description: '20 �������! ���� ������ ����������� ����� ���������� ��������� � ��������.' },
        { level: 25, achieved: currentLevel >= 25, title: '?? ������� ������', description: '�������� ���� ��������! �� �������� ���������� �� ������� ������.' },
        { level: 30, achieved: currentLevel >= 30, title: '?? ������ �����', description: '30 �������! ��� ���������� ��������� �������� �������� �����.' },
        { level: 35, achieved: currentLevel >= 35, title: '?? ��������������� ������', description: '35 �������! �� �������� ������ � �������������� ���������.' },
        { level: 40, achieved: currentLevel >= 40, title: '?? �������� �����', description: '40 �������! ���� ��������� ����������� ����� �������� ��������.' },
        { level: 45, achieved: currentLevel >= 45, title: '?? ������ �����������', description: '45 �������! �� �������� ����� � �������� �����.' },
        { level: 50, achieved: currentLevel >= 50, title: '?? �������� ���� � ������������', description: '50 �������! �������� ���� ��������. �� �� ���������� ���� � ����������!' },
        { level: 55, achieved: currentLevel >= 55, title: '?? ������ �����������', description: '55 �������! ���� ������ ����������� ����� ����.' },
        { level: 60, achieved: currentLevel >= 60, title: '?? ������� �����', description: '60 �������! �� ��������� � ���� ������ ������.' },
        { level: 65, achieved: currentLevel >= 65, title: '? ������ � ��������', description: '65 �������! ��� �������� ����������� � ����������.' },
        { level: 70, achieved: currentLevel >= 70, title: '?? �������� ������', description: '70 �������! ���� �������� ������ ������ �������� � �����������.' },
        { level: 75, achieved: currentLevel >= 75, title: '?? �������� �����', description: '75 �������! �� �������� ������� �� ���������� ����.' },
        { level: 80, achieved: currentLevel >= 80, title: '?? ������� �����������', description: '80 �������! �� ������� � �������� ����������� �����.' },
        { level: 85, achieved: currentLevel >= 85, title: '?? ������� �����', description: '85 �������! ���� �������� ���������� ���������.' },
        { level: 90, achieved: currentLevel >= 90, title: '?? ��������� �����������', description: '90 �������! �� ������� ����� ����������� �����.' },
        { level: 95, achieved: currentLevel >= 95, title: '?? ������������ ������', description: '95 �������! ���� ���� ����������� ������� � �����.' },
        { level: 100, achieved: currentLevel >= 100, title: '?? ������������ �������', description: '100 �������! �� �������� ������������� ���������� � ���������� �����!' }
    ];
    
    // ��������� ����������, ������� ����� �������� (����������� + ��������� 2)
    const achievedCount = achievements.filter(a => a.achieved).length;
    const visibleAchievements = achievements.slice(0, Math.max(achievedCount + 2, 3));
    
    container.innerHTML = visibleAchievements.map(achievement => `
        <div class="achievement-item ${achievement.achieved ? 'achieved' : 'locked'}">
            <div class="achievement-icon">${achievement.achieved ? '?' : '??'}</div>
            <div class="achievement-content">
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-level">������� ${achievement.level}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
            <div class="achievement-status">
                ${achievement.achieved ? 
                    '<span class="status-achieved">��������</span>' : 
                    `<span class="status-locked">${currentLevel}/${achievement.level}</span>`
                }
            </div>
        </div>
    `).join('');
}

function updateRecords() {



}

// Stub functions for charts that would need more complex implementation










// Initialize app when page loads (removed duplicate)

// Network status handlers
window.addEventListener('online', () => {
    console.log('��������-���������� �������������');
    showNotification('��������-���������� �������������', 'success');
    
    // ��������� ������ �������������
    updateSyncStatus();
    
    // �������������� ������ ��� �������������� ���������� ����������
    if (appState.isVerified) {
        syncWithFirestore().then(result => {
            if (result) {
                console.log('? �������������� ������������� ��� �������������� ���������� ���������');
            } else {
                console.log('?? �������������� ������������� ��� �������������� ���������� �� �������');
            }
        }).catch(error => {
            console.log('? ������ �������������� ������������� ��� �������������� ����������:', error);
        });
    }
});

window.addEventListener('offline', () => {
    console.log('��������-���������� ��������');
    showNotification('��������-���������� ��������', 'warning');
    
    // ��������� ������ �������������
    updateSyncStatus();
});

// Autocomplete interactions for reward ideas
document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'ideaDescription') {
        renderIdeaSuggestions(e.target.value);
    }
});
document.addEventListener('click', function(e) {
    const list = document.getElementById('ideaAutocomplete');
    const input = document.getElementById('ideaDescription');
    if (!list || !input) return;
    // Remove item
    const removeBtn = e.target.closest && e.target.closest('.autocomplete-remove');
    if (removeBtn) {
        const val = removeBtn.getAttribute('data-remove');
        removeIdea(val);
        renderIdeaSuggestions(input.value || '');
        e.stopPropagation();
        return;
    }
    // Pick item
    const item = e.target.closest && e.target.closest('.autocomplete-item');
    if (item && item.getAttribute('data-value')) {
        input.value = item.getAttribute('data-value');
        list.style.display = 'none';
        list.innerHTML = '';
        input.focus();
        return;
    }
    // Click outside autocomplete closes it
    if (!e.target.closest('.autocomplete-wrap')) {
        list.style.display = 'none';
        list.innerHTML = '';
    }
});

// Account selection & role handling
function selectAccount(role) {
    const previousRole = appState.role;
    const previousUserName = appState.userName;
    
    appState.role = role === 'admin' ? 'admin' : 'viewer';
    
    // ������������� ��� ������������ � ����������� �� ����
    if (role === 'viewer') {
        appState.userName = '������';
    } else {
        appState.userName = 'Admin';
    }
    
    // ��������� ��������� ������ ��������
    saveState();
    
    console.log(`? ������� ������ ��������: ${previousUserName} (${previousRole}) > ${appState.userName} (${appState.role})`);
    
    // ��������� ��������� ���� ������ ������� ������
    document.getElementById('accountModal').classList.remove('show');
    
    // ������� ���������� � ���������� �������� �������
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    if (overlay) overlay.classList.remove('show');
    if (container) container.classList.remove('hidden');
    
    // ���������� ����������� ��� �����
    appState.isVerified = false;
    showVerificationModal();
    
    console.log('?? ������� ������ ��������, ������������� ��� ����������...');
    
    // ������ �������� ���� �����������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ������� ������ ��������, ��� ���������� �����������');
    
    // ��������� ����������� ������� ��������
    updateLearningTimeDisplay();
    
    showNotification(appState.userName === '������' ? '����� �������' : '����� ��������������', 'info');
    
    // ������������� ��������� � Firebase ����� ����� ������� ������
    safeSetTimeout(() => {
        saveDataToFirebaseSilent();
    }, 1000);
}

// Change Account Modal
function showChangeAccountModal() {
    // ���������� ������ ����������� ��� ����� ������� ������
    appState.isVerified = false;
    document.getElementById('accountModal').classList.add('show');
    
    // �������� �������� ������� � ���������� ����������
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    if (overlay) overlay.classList.add('show');
    if (container) container.classList.add('hidden');
    
    console.log('?? ���������� ����� ������� ������, ������������� ��� ����������...');
    
    // ������ �������� ���� �����������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ����� ������� ������ ��������, ��� ���������� �����������');
    
    // ��������� ����������� ������� ��������
    updateLearningTimeDisplay();
    
    // ��������������� ��������� ������ (��� �������� �� ���������)
    restoreSettingsBlocksState();
    
    // �������������� ���������� ��������� ��� ������ ����� ������� ������
    // saveDataToFirebase();
    
    toggleSettingsMenu(); // Close settings menu
}

// Proper offline QR encoder (fallback, �� �������������� �������� ������)
function drawQrToCanvasFallback(text) {
    const canvas = document.getElementById('qrCanvas');
    if (!canvas) return;
    
    // Simple but effective QR-like pattern generator
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // Generate deterministic pattern based on text
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash + text.charCodeAt(i)) >>> 0;
    }
    
    // Create QR-like grid pattern
    const gridSize = 8;
    const cells = size / gridSize;
    
    ctx.fillStyle = '#000000';
    for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
            // Use hash to determine if cell should be filled
            hash = (hash * 1103515245 + 12345) >>> 0;
            if ((hash & 1) === 0) {
                ctx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
            }
        }
    }
    
    // Add corner markers (QR code style)
    ctx.fillStyle = '#000000';
    // Top-left corner
    ctx.fillRect(0, 0, gridSize * 3, gridSize * 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gridSize, gridSize, gridSize, gridSize);
    // Top-right corner
    ctx.fillStyle = '#000000';
    ctx.fillRect(size - gridSize * 3, 0, gridSize * 3, gridSize * 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size - gridSize * 2, gridSize, gridSize, gridSize);
    // Bottom-left corner
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, size - gridSize * 3, gridSize * 3, gridSize * 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gridSize, size - gridSize * 2, gridSize, gridSize);
}

// PIN Code Management Functions
let currentPin = '';
let setupPin = '';
let setupPinStep = 1; // 1 = first entry, 2 = confirmation
let isChangingPin = false; // ���� ��� ������ ����� PIN-����



// Show verification modal
function showVerificationModal() {
    console.log('?? ���������� ��������� ���� ����������� ���:', appState.userName);
    
    const userInfo = document.getElementById('verificationUserInfo');
    const setupSection = document.getElementById('setupPinSection');
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    
    if (userInfo) userInfo.textContent = appState.userName;
    
    // Check if user has PIN code
    const hasPin = appState.pinCodes[appState.userName];
    if (hasPin) {
        setupSection.style.display = 'none';
        console.log('?? PIN-��� ������, ���������� ����� �����');
    } else {
        setupSection.style.display = 'block';
        console.log('?? PIN-��� �� ������, ���������� ����� ���������');
    }
    
    resetPinInput();
    
    console.log('?? ���������� �����������, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ����� ������� �����������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ����������� ��������, ��� ���������� �����������');
    
    document.getElementById('verificationModal').classList.add('show');
    if (overlay) overlay.classList.add('show');
    if (container) container.classList.add('hidden');
}

// Hide verification modal
function hideVerificationModal() {
    document.getElementById('verificationModal').classList.remove('show');
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    if (overlay) overlay.classList.remove('show');
    if (container) container.classList.remove('hidden');
    resetPinInput();
    
    // ���������� ���� ����� PIN-���� ��� ������
    if (isChangingPin) {
        isChangingPin = false;
    }
    
    // ���� ������������ �� ������ �����������, ���������� ����� ������� ������
    // �� ������ ���� ��� �� ���� ����� PIN-����
    if (!appState.isVerified && !isChangingPin) {
        console.log('?? ����������� ��������, ������������ � ������ ������� ������');
        showAccountSelection();
    }
}

// Show setup PIN modal
function showSetupPinModal() {
    const userInfo = document.getElementById('setupPinUserInfo');
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    const title = document.getElementById('setupPinModalTitle');
    
    if (userInfo) userInfo.textContent = appState.userName;
    
    // ��������� ��������� � ����������� �� ������
    if (title) {
        if (isChangingPin) {
            title.textContent = '?? ����� PIN-����';
        } else {
            title.textContent = '?? ��������� PIN-����';
        }
    }
    
    resetSetupPinInput();
    
    console.log('?? ���������� ��������� PIN-����, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ����� ������� ��������� PIN-����
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ��������� PIN-���� ��������, ��� ���������� �����������');
    
    // �������������� ���������� ��������� ��� ������ ��������� PIN-����
    // saveDataToFirebase();
    
    document.getElementById('setupPinModal').classList.add('show');
    if (overlay) overlay.classList.add('show');
    if (container) container.classList.add('hidden');
}

// Hide setup PIN modal
function hideSetupPinModal() {
    document.getElementById('setupPinModal').classList.remove('show');
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    if (overlay) overlay.classList.remove('show');
    if (container) container.classList.remove('hidden');
    resetSetupPinInput();
    
    // ���� ��� ���� ������ ����� PIN-����, ���������� ����
    if (isChangingPin) {
        isChangingPin = false;
    }
}

// Show change PIN modal
function showChangePinModal() {
    // ������������� ���� ������ ����� PIN-����
    isChangingPin = true;
    
    console.log('?? ���������� ����� PIN-����, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ����� ������� ����� PIN-����
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ����� PIN-���� ��������, ��� ���������� �����������');
    
    // �������������� ���������� ��������� ��� ������ ����� PIN-����
    // saveDataToFirebase();
    
    // First verify current PIN
    showVerificationModal();
}

// Add digit to PIN input
function addPinDigit(digit) {
    if (currentPin.length < 4) {
        currentPin += digit;
        updatePinDisplay();
        updateVerifyButton();
    }
}

// Delete digit from PIN input
function deletePinDigit() {
    if (currentPin.length > 0) {
        currentPin = currentPin.slice(0, -1);
        updatePinDisplay();
        updateVerifyButton();
    }
}

// Add digit to setup PIN input
function addSetupPinDigit(digit) {
    if (setupPin.length < 4) {
        setupPin += digit;
        updateSetupPinDisplay();
        updateSetupButton();
    }
}

// Delete digit from setup PIN input
function deleteSetupPinDigit() {
    if (setupPin.length > 0) {
        setupPin = setupPin.slice(0, -1);
        updateSetupPinDisplay();
        updateSetupButton();
    }
}

// Update PIN display dots
function updatePinDisplay() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`pinDot${i}`);
        if (dot) {
            if (i <= currentPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        }
    }
}

// Update setup PIN display dots
function updateSetupPinDisplay() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`setupPinDot${i}`);
        if (dot) {
            if (i <= setupPin.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        }
    }
}

// Reset PIN input
function resetPinInput() {
    currentPin = '';
    updatePinDisplay();
    updateVerifyButton();
}

// Reset setup PIN input
function resetSetupPinInput() {
    setupPin = '';
    setupPinStep = 1;
    updateSetupPinDisplay();
    updateSetupButton();
}

// Update verify button state
function updateVerifyButton() {
    const btn = document.getElementById('verifyBtn');
    if (btn) {
        btn.disabled = currentPin.length !== 4;
    }
}

// Update setup button state
function updateSetupButton() {
    const btn = document.getElementById('confirmSetupBtn');
    if (btn) {
        btn.disabled = setupPin.length !== 4;
        
        // ��������� ����� ������ � ����������� �� ������
        if (isChangingPin) {
            btn.textContent = '? ��������';
        } else {
            btn.textContent = '? ���������';
        }
    }
}

// Verify PIN code
function verifyPin() {
    console.log(`?? ��������� PIN-��� ��� ������������: ${appState.userName}`);
    console.log('?? ��������� PIN-�����:', appState.pinCodes);
    
    // ���������, ��������� �� PIN-���� �� Firebase
    if (Object.keys(appState.pinCodes).length === 0) {
        console.log('? PIN-���� �� ��������� �� Firebase');
        showNotification('PIN-���� �� ���������. ��������� ��������-����������.', 'error');
        return;
    }
    
    const storedPin = appState.pinCodes[appState.userName];
    
    if (!storedPin) {
        console.log('? PIN-��� �� ���������� ��� ������������:', appState.userName);
        showNotification('PIN-��� �� ���������� ��� ����� ������������', 'error');
        return;
    }
    
    console.log(`?? ��������� PIN: ${currentPin}, ����������� PIN: ${storedPin}`);
    
    if (currentPin === storedPin) {
        if (isChangingPin) {
            // ���� ��� ����� ����� PIN-����, ���������� ���� ���������
            isChangingPin = false; // ���������� ����
            hideVerificationModal();
            showSetupPinModal();
            showNotification('������� ����� PIN-���', 'info');
        } else {
            // ������� ���� � �������
            appState.isVerified = true;
            hideVerificationModal();
            
                            // ��������� ���� ������ ����� �������� �����������
    applyRolePermissions();
    
    // ��������������� ��������� ������ (��� �������� �� ���������)
    restoreSettingsBlocksState();
    
    console.log('?? ���� �������� �������, ������������� ��� ����������...');
            
            // ������ �������� ���� �����������
            
            // 1. ������������� ������ ������
            recalculateBestWeek();
            
            // 2. ��������� ��� �����������
            updateProgressDisplay();
            updateBestWeekDisplay();
            updateRedeemControls();
            updateProgressWeekSection();
            updateMonthlyProgressSection();
            updateWeeklyStars();
            
            // 3. ���������, ��� ��� ���������� ���������
            console.log('? ���� �������� �������, ��� ���������� �����������');
            
            showNotification('���� �������� �������! ��� ���������� �����������.', 'success');
            
            // ������������� ��������� � Firebase ����� ��������� �����
            safeSetTimeout(() => {
                saveDataToFirebaseSilent();
            }, 1000);
            
            // Show welcome modal for Mikhail
            if (appState.userName === '������') {
                showWelcomeModal();
            }
        }
    } else {
        showNotification('�������� PIN-���', 'error');
        resetPinInput();
    }
}

// Setup new PIN code
function setupNewPin() {
    hideVerificationModal();
    showSetupPinModal();
}

// Confirm setup PIN code
async function confirmSetupPin() {
    if (setupPin.length !== 4) {
        showNotification('PIN-��� ������ ��������� 4 �����', 'error');
        return;
    }
    
    console.log(`?? ��������� PIN-��� ��� ������������: ${appState.userName}`);
    console.log(`?? PIN-���: ${setupPin}`);
    
    // Save PIN code
    appState.pinCodes[appState.userName] = setupPin;
    
    console.log('?? ������� PIN-����:', appState.pinCodes);
    
    // ��������� PIN-���� ������ � Firebase
    if (navigator.onLine && isFirebaseAvailable()) {
        console.log('?? ��������� PIN-��� � Firebase...');
        try {
            const saved = await savePinCodesToFirebase();
            if (saved) {
                console.log('? PIN-��� ������� �������� � Firebase');
                showNotification('PIN-��� ���������� � �������� � ������!', 'success');
            } else {
                console.log('? �� ������� ��������� PIN-��� � Firebase');
                showNotification('PIN-��� ���������� ��������, �� �� �������� � ������', 'warning');
            }
        } catch (error) {
            console.error('? ������ ���������� PIN-���� � Firebase:', error);
            showNotification('������ ���������� PIN-���� � ������', 'error');
        }
    } else {
        console.log('?? Firebase ����������, PIN-��� �������� ������ ��������');
        showNotification('PIN-��� ���������� �������� (Firebase ����������)', 'warning');
    }
    
    hideSetupPinModal();
    
    if (isChangingPin) {
        // ���� ��� ���� ����� PIN-����
        showNotification('PIN-��� ������� �������!', 'success');
        // ������������ �������� � �������, ��� ��� �� ��� ��� �������������
    } else {
        // ���� ��� ���� ������ ��������� PIN-����
        showNotification('PIN-��� ���������� �������!', 'success');
        // Auto-verify user
        appState.isVerified = true;
        
        // ��������� ���� ����� �������� ��������� PIN-����
        applyRolePermissions();
        
        // ������������� ��������� � Firebase ����� ��������� PIN-����
        safeSetTimeout(() => {
            saveDataToFirebaseSilent();
        }, 1000);
        
        console.log('?? PIN-��� ����������, ������������� ��� ����������...');
        
        // ������ �������� ���� �����������
        
        // 1. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        updateProgressDisplay();
        updateBestWeekDisplay();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        
        // 3. ���������, ��� ��� ���������� ���������
        console.log('? PIN-��� ����������, ��� ���������� �����������');
        
        // Show welcome modal for Mikhail
        if (appState.userName === '������') {
            showWelcomeModal();
        }
    }
}

// Check if user needs verification
function needsVerification() {
    return !appState.isVerified;
}

// Logout user
function logoutUser() {
    appState.isVerified = false;
    
    // ������������� �����������������
    stopAutoSync();
    
    // �������������� ���������� ���������
    showNotification('����� ��������', 'info');
}

// ========================================
// FIREBASE FIRESTORE INTEGRATION
// ========================================

// Check if Firebase is available
function isFirebaseAvailable() {
    // Check if Firebase is ready and functions are available
    if (window.firebaseReady === true) {
        return true;
    }
    
    // Fallback check for older versions
    return window.db && window.doc && window.setDoc && window.getDoc && window.updateDoc;
}

// Clean data for Firebase storage
function cleanDataForFirestore(data) {
    const cleaned = { ...data };
    
    console.log('?? ������� ������ ��� Firebase...');
    
    // ������� ��� ����������� �������������� Date � ������
    function safeDateToString(date) {
        if (!date) return null;
        
        try {
            // ���������, ��� ��� �������� Date ������
            if (date instanceof Date && !isNaN(date.getTime())) {
                return date.toISOString();
            }
            
            // ���� ��� ������, �������� ������� Date � ���������
            if (typeof date === 'string') {
                const parsedDate = new Date(date);
                if (!isNaN(parsedDate.getTime())) {
                    return parsedDate.toISOString();
                }
            }
            
            // ���� ������ �� ��������, ���������� null
            console.warn('?? ������������ ����:', date);
            return null;
        } catch (error) {
            console.warn('?? ������ ��� ��������� ����:', date, error);
            return null;
        }
    }
    
    // ������� �������� Date ����
    if (cleaned.currentMonth) {
        cleaned.currentMonth = safeDateToString(cleaned.currentMonth);
    }
    
    if (cleaned.selectedDate) {
        cleaned.selectedDate = safeDateToString(cleaned.selectedDate);
    }
    
    if (cleaned.resetDate) {
        cleaned.resetDate = safeDateToString(cleaned.resetDate);
    }
    
    // ������� Date ���� � activityData
    if (cleaned.activityData) {
        Object.keys(cleaned.activityData).forEach(dateStr => {
            if (cleaned.activityData[dateStr] && Array.isArray(cleaned.activityData[dateStr])) {
                cleaned.activityData[dateStr].forEach(activity => {
                    if (activity.completedAt) {
                        activity.completedAt = safeDateToString(activity.completedAt);
                    }
                });
            }
        });
    }
    
    // ������� Date ���� � tasks
    if (cleaned.tasks && Array.isArray(cleaned.tasks)) {
        cleaned.tasks.forEach(task => {
            if (task.createdAt) {
                task.createdAt = safeDateToString(task.createdAt);
            }
            if (task.completedAt) {
                task.completedAt = safeDateToString(task.completedAt);
            }
        });
    }
    
    // ������� Date ���� � rewards
    if (cleaned.rewards && Array.isArray(cleaned.rewards)) {
        cleaned.rewards.forEach(reward => {
            if (reward.createdAt) {
                reward.createdAt = safeDateToString(reward.createdAt);
            }
            if (reward.claimedAt) {
                reward.claimedAt = safeDateToString(reward.claimedAt);
            }
        });
    }
    
    // ������� Date ���� � saveStats
    if (cleaned.saveStats) {
        if (cleaned.saveStats.firstSave) {
            cleaned.saveStats.firstSave = safeDateToString(cleaned.saveStats.firstSave);
        }
        if (cleaned.saveStats.lastSave) {
            cleaned.saveStats.lastSave = safeDateToString(cleaned.saveStats.lastSave);
        }
    }
    
    // ������� Date ���� � deviceInfo
    if (cleaned.deviceInfo && cleaned.deviceInfo.timestamp) {
        cleaned.deviceInfo.timestamp = safeDateToString(cleaned.deviceInfo.timestamp);
    }
    
    console.log('? ������ ������� ��� Firebase');
    return cleaned;
}

// Save PIN codes to Firebase (�������� ��������)
async function savePinCodesToFirebase() {
    if (!navigator.onLine || !isFirebaseAvailable()) {
        console.log('?? ���������� PIN-����� ��������: ��� ��������� ��� Firebase');
        return false;
    }
    
    // �������������� �������� ����������� updateDoc
    if (typeof updateDoc === 'undefined') {
        console.error('? updateDoc �� ��������');
        return false;
    }

    try {
        console.log('?? ��������� PIN-���� � Firebase...');
        
        // �������������� ������ ��� ����������
        const pinData = {
            pinCodes: appState.pinCodes,
            lastUpdated: new Date().toISOString(),
            savedBy: appState.userName,
            version: '1.0',
            dataType: 'pin-codes'
        };
        
        // ��������� � ��������� pin-backups
        const pinBackupRef = doc(db, 'pin-backups', 'main');
        await retryOperation(async () => {
            return await setDoc(pinBackupRef, pinData, { merge: true });
        }, 3, 1000);
        
        // ����� ��������� � shared-data ��� �������������
        const sharedRef = doc(db, 'shared-data', 'main');
        await retryOperation(async () => {
            return await updateDoc(sharedRef, {
                pinCodes: appState.pinCodes,
                lastPinUpdate: new Date().toISOString()
            });
        }, 3, 1000);
        
        console.log('? PIN-���� ������� ��������� � Firebase');
        console.log('?? ����������� PIN-����:', appState.pinCodes);
        return true;
    } catch (error) {
        console.error('? ������ ���������� PIN-����� � Firebase:', error);
        return false;
    }
}

// Load PIN codes from Firebase (�������� ��������)
async function loadPinCodesFromFirebase() {
    if (!navigator.onLine || !isFirebaseAvailable()) {
        console.log('?? �������� PIN-����� ��������: ��� ��������� ��� Firebase');
        return false;
    }
    
    // �������������� �������� ����������� Firebase �������
    if (typeof doc === 'undefined' || typeof getDoc === 'undefined') {
        console.error('? Firebase ������� �� ��������');
        return false;
    }

    try {
        console.log('?? ��������� PIN-���� �� Firebase...');
        
        // �������� ��������� �� ��������� pin-backups
        const pinBackupRef = doc(db, 'pin-backups', 'main');
        const pinBackupSnap = await retryOperation(async () => {
            return await getDoc(pinBackupRef);
        }, 3, 1000);
        
        if (pinBackupSnap.exists()) {
            const backupData = pinBackupSnap.data();
            const backupPinCodes = backupData.pinCodes;
            
            if (backupPinCodes && typeof backupPinCodes === 'object') {
                // ���������� PIN-����
                const validatedPins = validatePinCodes(backupPinCodes);
                
                // ��������� �������� PIN-���� (�� ���������� � ����������)
                appState.pinCodes = validatedPins;
                
                console.log('? PIN-���� ��������� �� Firebase');
                console.log('?? ����������� PIN-����:', appState.pinCodes);
                return true;
            }
        }
        
        // ���� � pin-backups ���, ������� ��������� �� shared-data
        console.log('?? PIN-���� �� ������� � pin-backups, ������� shared-data...');
        const sharedRef = doc(db, 'shared-data', 'main');
        const sharedSnap = await retryOperation(async () => {
            return await getDoc(sharedRef);
        }, 3, 1000);
        
        if (sharedSnap.exists()) {
            const sharedData = sharedSnap.data();
            if (sharedData.pinCodes && typeof sharedData.pinCodes === 'object') {
                const validatedPins = validatePinCodes(sharedData.pinCodes);
                appState.pinCodes = validatedPins;
                
                console.log('? PIN-���� ��������� �� shared-data');
                console.log('?? ����������� PIN-����:', appState.pinCodes);
                return true;
            }
        }
        
        console.log('?? PIN-���� �� ������� �� � ����� ��������� Firebase');
        return false;
    } catch (error) {
        console.error('? ������ �������� PIN-����� �� Firebase:', error);
        return false;
    }
}

// Force sync PIN codes with Firebase
async function forceSyncPinCodes() {
    if (!navigator.onLine || !isFirebaseAvailable()) {
        console.log('?? �������������� ������������� PIN-����� ��������: ��� ��������� ��� Firebase');
        return false;
    }
    
    // �������������� �������� ����������� Firebase �������
    if (typeof setDoc === 'undefined' || typeof getDoc === 'undefined') {
        console.error('? Firebase ������� �� ��������');
        return false;
    }

    try {
        console.log('?? �������������� ������������� PIN-�����...');
        
        // ������� ��������� �� Firebase
        const loadResult = await loadPinCodesFromFirebase();
        
        if (loadResult) {
            // ����� ��������� ������� PIN-���� ������� � Firebase
            const saveResult = await savePinCodesToFirebase();
            
            if (saveResult) {
                console.log('? PIN-���� ������� ���������������� � Firebase');
                
                console.log('?? PIN-���� ����������������, ������������� ��� ����������...');
                
                // ������ �������� ���� �����������
                
                // 1. ������������� ������ ������
                recalculateBestWeek();
                
                // 2. ��������� ��� �����������
                updateProgressDisplay();
                updateBestWeekDisplay();
                updateRedeemControls();
                updateProgressWeekSection();
                updateMonthlyProgressSection();
                updateWeeklyStars();
                
                // 3. ���������, ��� ��� ���������� ���������
                console.log('? PIN-���� ����������������, ��� ���������� �����������');
                
                return true;
            } else {
                console.log('?? PIN-���� ���������, �� �� ��������� � Firebase');
                return false;
            }
        } else {
            // ���� �������� �� �������, ������ ��������� �������
            const saveResult = await savePinCodesToFirebase();
            
            if (saveResult) {
                // ������������� ������ ������ ����� ���������� PIN-�����
                recalculateBestWeek();
            }
            
            return saveResult;
        }
    } catch (error) {
        console.error('? ������ �������������� ������������� PIN-�����:', error);
        return false;
    }
}

// Force restore PIN codes from Firebase only
async function forceRestorePinCodes() {
    console.log('?? �������������� �������������� PIN-����� �� Firebase...');
    
    if (!navigator.onLine || !isFirebaseAvailable()) {
        console.log('?? Firebase ����������, �������������� ����������');
        return false;
    }
    
    // �������������� �������� ����������� Firebase �������
    if (typeof getDoc === 'undefined') {
        console.error('? Firebase ������� �� ��������');
        return false;
    }
    
    try {
        const result = await loadPinCodesFromFirebase();
        if (result) {
            console.log('? PIN-���� ������������� �� Firebase');
            console.log('?? ������� PIN-����:', appState.pinCodes);
            
            console.log('?? PIN-���� �������������, ������������� ��� ����������...');
            
            // ������ �������� ���� �����������
            
            // 1. ������������� ������ ������
            recalculateBestWeek();
            
            // 2. ��������� ��� �����������
            updateProgressDisplay();
            updateBestWeekDisplay();
            updateRedeemControls();
            updateProgressWeekSection();
            updateMonthlyProgressSection();
            updateWeeklyStars();
            
            // 3. ���������, ��� ��� ���������� ���������
            console.log('? PIN-���� �������������, ��� ���������� �����������');
            
            return true;
        } else {
            console.log('?? PIN-���� �� ������� � Firebase');
            return false;
        }
    } catch (error) {
        console.error('? ������ �������������� PIN-����� �� Firebase:', error);
        return false;
    }
}

// Save data to Firebase with enhanced UI feedback (for manual save)
async function saveDataToFirebase() {
    // ���������, �� ���������� �� �������������
    if (appState.isInitializing) {
        console.log('?? �������������� ���������� ��������� �� ����� �������������');
        return false;
    }
    
    // Get the save button
    const saveBtn = document.querySelector('.save-btn');
    if (!saveBtn) return false;

    // Set loading state
    saveBtn.classList.remove('success', 'error');
    saveBtn.classList.add('loading');

    try {
        // Call the original save function with showDetails flag for manual save
        const result = await saveStateToFirestore(true);
        
        if (result) {
            // Success state
            saveBtn.classList.remove('loading');
            saveBtn.classList.add('success');
            
            // Reset to normal state after 2 seconds
            safeSetTimeout(() => {
                saveBtn.classList.remove('success');
            }, 2000);
            
            return true;
        } else {
            // Error state
            saveBtn.classList.remove('loading');
            saveBtn.classList.add('error');
            
            // Reset to normal state after 3 seconds
            safeSetTimeout(() => {
                saveBtn.classList.remove('error');
            }, 3000);
            
            return false;
        }
    } catch (error) {
        // Error state
        saveBtn.classList.remove('loading');
        saveBtn.classList.add('error');
        
        // Reset to normal state after 3 seconds
        safeSetTimeout(() => {
            saveBtn.classList.remove('error');
        }, 3000);
        
        return false;
    }
}

// Save data to Firebase without showing details (for automatic saves)
async function saveDataToFirebaseSilent() {
    // ���������, �� ���������� �� �������������
    if (appState.isInitializing) {
        console.log('?? �������������� ���������� ��������� �� ����� �������������');
        return false;
    }
    
    if (!isFirebaseAvailable()) {
        console.log('Firebase ����������, ��������� ������ ��������');
        return false;
    }

    if (!navigator.onLine) {
        console.log('��� ��������-����������');
        return false;
    }

    try {
        // Call the original save function without showing details
        const result = await saveStateToFirestore(false);
        return result;
    } catch (error) {
        console.error('? ������ ��������������� ���������� � Firebase:', error);
        return false;
    }
}

// Save state to Firestore (original function)
async function saveStateToFirestore(showDetails = false) {
    // ���������, �� ���������� �� �������������
    if (appState.isInitializing) {
        console.log('?? ���������� � Firebase ��������� �� ����� �������������');
        return false;
    }
    
    if (!isFirebaseAvailable()) {
        console.log('Firebase ����������, ��������� ������ ��������');
        showNotification('Firebase ����������', 'warning');
        return false;
    }

    if (!navigator.onLine) {
        console.log('��� ��������-����������');
        showNotification('��� ��������-����������', 'warning');
        return false;
    }

    try {
        console.log('?? �������� ���������� � Firebase...');
        
        // ���������� ��������� ������ ��� ����������
        const dataToSave = {
            // �������� ������ (� ��������� �� �������������)
            progress: appState.progress || {},
            tasks: appState.tasks || [],
            rewards: appState.rewards || [],
            activityData: appState.activityData || {},
            rewardPlan: appState.rewardPlan || { description: '' },
            resetDate: appState.resetDate ? appState.resetDate.toISOString() : null,
            currentMonth: appState.currentMonth ? appState.currentMonth.toISOString() : null,
            selectedDate: appState.selectedDate ? appState.selectedDate.toISOString() : null,
            
            // ��������� ������� (�����!)
            backupSettings: appState.backupSettings || {
                autoBackup: true,
                backupFrequency: 'daily',
                maxBackups: 7,
                lastBackup: null,
                nextBackup: null,
                backupTypes: {
                    scheduled: true,
                    manual: true
                }
            },
            
            // ����������
            lastUpdated: new Date().toISOString(),
            lastSavedBy: appState.userName || 'Unknown',
            version: '1.0',
            
            // ������� ����������
            saveStats: {
                totalSaves: (appState.saveStats?.totalSaves || 0) + 1,
                lastSave: new Date().toISOString()
            }
        };
        
        // ��������� � ����� ��������� � retry
        const sharedRef = doc(db, 'shared-data', 'main');
        await retryOperation(async () => {
            return await setDoc(sharedRef, dataToSave, { merge: true });
        }, 3, 1000);
        
        // ��������� ��������� ���������
        appState.saveStats = dataToSave.saveStats;
        
        // PIN-���� ����������� �������� ����� savePinCodesToFirebase
        // ����� �� �� ���������, ����� �������� ������������
        
        console.log('? ������ ������� ��������� � Firebase');
        showNotification('������ ��������� � Firebase', 'success');
        
        // ���������� ��������� ���������� � ���������� ������ ��� ������ ����������
        if (showDetails) {
            showSaveDetails(dataToSave);
        }
        
        return true;
    } catch (error) {
        console.error('? ������ ���������� � Firebase:', error);
        
        // ��������� ��� ������
        if (error.message && error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
            console.warn('?? ������ ������������ �������� (��������, ����������� �������)');
            showNotification('Firebase ������������ ����������� �������', 'warning');
        } else if (error.code === 'permission-denied') {
            console.warn('?? �������� � ������� � Firestore');
            showNotification('�������� � ������� � Firestore', 'error');
        } else if (error.code === 'unavailable') {
            console.warn('?? Firestore ����������');
            showNotification('Firestore ����������', 'error');
        } else if (error.code === 'resource-exhausted') {
            console.warn('?? ��������� ������ Firestore');
            showNotification('��������� ������ Firestore', 'warning');
        } else {
            showNotification('������ ���������� � Firebase', 'error');
        }
        
        return false;
    }
}

// Validate PIN codes
function validatePinCodes(pinCodes) {
    if (!pinCodes || typeof pinCodes !== 'object') {
        console.warn('?? PIN-���� ����������� ��� ����� �������� ������');
        return {};
    }
    
    const validated = {};
    let hasValidPins = false;
    
    // ��������� ������ PIN-���
    Object.keys(pinCodes).forEach(userName => {
        const pin = pinCodes[userName];
        
        if (pin && typeof pin === 'string' && pin.length === 4 && /^\d{4}$/.test(pin)) {
            validated[userName] = pin;
            hasValidPins = true;
            console.log(`? PIN-��� ��� ${userName} �������: ${pin}`);
        } else if (pin === null || pin === undefined) {
            validated[userName] = null;
            console.log(`?? PIN-��� ��� ${userName} �� ����������`);
        } else {
            console.warn(`?? ������������ PIN-��� ��� ${userName}: ${pin}`);
            validated[userName] = null;
        }
    });
    
    // �� ������� ������ PIN-���� - ��� ������ ���� ��������� �� Firebase
    
    if (hasValidPins) {
        console.log('? PIN-���� ������ ���������');
    } else {
        console.log('?? ��� PIN-���� �� �����������');
    }
    
    return validated;
}

// Restore data types after loading from Firestore
function restoreDataTypes(data) {
    if (!data) {
        console.warn('?? ��� ������ ��� ��������������');
        return {};
    }
    
    const restored = { ...data };
    
    console.log('?? ��������������� ���� ������...');
    
    // ������� ��� ����������� �������� Date �������
    function safeStringToDate(dateValue) {
        if (!dateValue) return null;
        
        try {
            // ���� ��� Firebase Timestamp ������
            if (dateValue && typeof dateValue.toDate === 'function') {
                const date = dateValue.toDate();
                console.log('?? Firebase Timestamp ������������ � Date:', date);
                return date;
            }
            
            // ���� ��� ������
            if (typeof dateValue === 'string') {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    return date;
                } else {
                    console.warn('?? ������������ ������ ����:', dateValue);
                    return null;
                }
            }
            
            // ���� ��� ��� Date ������
            if (dateValue instanceof Date) {
                return dateValue;
            }
            
            console.warn('?? ����������� ��� ����:', typeof dateValue, dateValue);
            return null;
        } catch (error) {
            console.warn('?? ������ ��� �������� Date:', dateValue, error);
            return null;
        }
    }
    
    // Restore Date objects
    if (restored.currentMonth) {
        const date = safeStringToDate(restored.currentMonth);
        if (date) {
            restored.currentMonth = date;
            console.log('?? currentMonth ������������');
        } else {
            restored.currentMonth = new Date();
            console.log('?? currentMonth ���������� �� ���������');
        }
    }
    
    if (restored.selectedDate) {
        const date = safeStringToDate(restored.selectedDate);
        if (date) {
            restored.selectedDate = date;
            console.log('?? selectedDate ������������');
        } else {
            restored.selectedDate = new Date();
            console.log('?? selectedDate ���������� �� ���������');
        }
    }
    
    if (restored.resetDate) {
        const date = safeStringToDate(restored.resetDate);
        if (date) {
            restored.resetDate = date;
            console.log('?? resetDate ������������');
        } else {
            restored.resetDate = new Date();
            console.log('?? resetDate ���������� �� ���������');
        }
    }
    
    // Restore Date objects in activityData
    if (restored.activityData) {
        let activityCount = 0;
        Object.keys(restored.activityData).forEach(dateStr => {
            if (restored.activityData[dateStr] && Array.isArray(restored.activityData[dateStr])) {
                restored.activityData[dateStr].forEach(activity => {
                    if (activity.completedAt) {
                        const date = safeStringToDate(activity.completedAt);
                        if (date) {
                            activity.completedAt = date;
                            activityCount++;
                        } else {
                            activity.completedAt = null;
                        }
                    }
                });
            }
        });
        if (activityCount > 0) {
            console.log(`?? ������������� ${activityCount} ������� ����������`);
        }
    }
    
    // PIN-���� �� ��������������� �� localStorage - ������ �� Firebase
    if (restored.pinCodes) {
        delete restored.pinCodes;
        console.log('?? PIN-���� ������� �� ��������������� ������ (�������� ������ �� Firebase)');
    }
    
    // ������������ ������� bestWeekXP
    if (restored.progress && typeof restored.progress.bestWeekXP === 'undefined') {
        restored.progress.bestWeekXP = 0;
        console.log('?? bestWeekXP ���������������');
    }
    
    // Restore Date objects in tasks
    if (restored.tasks && Array.isArray(restored.tasks)) {
        let taskCount = 0;
        restored.tasks.forEach(task => {
            if (task.createdAt && typeof task.createdAt === 'string') {
                const date = safeStringToDate(task.createdAt);
                if (date) {
                    task.createdAt = date;
                    taskCount++;
                } else {
                    task.createdAt = null;
                }
            }
            if (task.completedAt && typeof task.completedAt === 'string') {
                const date = safeStringToDate(task.completedAt);
                if (date) {
                    task.completedAt = date;
                    taskCount++;
                } else {
                    task.completedAt = null;
                }
            }
        });
        if (taskCount > 0) {
            console.log(`?? ������������� ${taskCount} ��� � ��������`);
        }
    }
    
    // Restore Date objects in rewards
    if (restored.rewards && Array.isArray(restored.rewards)) {
        let rewardCount = 0;
        restored.rewards.forEach(reward => {
            if (reward.createdAt && typeof reward.createdAt === 'string') {
                const date = safeStringToDate(reward.createdAt);
                if (date) {
                    reward.createdAt = date;
                    rewardCount++;
                } else {
                    reward.createdAt = null;
                }
            }
            if (reward.claimedAt && typeof reward.claimedAt === 'string') {
                const date = safeStringToDate(reward.claimedAt);
                if (date) {
                    reward.claimedAt = date;
                    rewardCount++;
                } else {
                    reward.claimedAt = null;
                }
            }
        });
        if (rewardCount > 0) {
            console.log(`?? ������������� ${rewardCount} ��� � ��������`);
        }
    }
    
    // Restore Date objects in saveStats
    if (restored.saveStats) {
        if (restored.saveStats.firstSave && typeof restored.saveStats.firstSave === 'string') {
            const date = safeStringToDate(restored.saveStats.firstSave);
            if (date) {
                restored.saveStats.firstSave = date;
            } else {
                restored.saveStats.firstSave = null;
            }
        }
        if (restored.saveStats.lastSave && typeof restored.saveStats.lastSave === 'string') {
            const date = safeStringToDate(restored.saveStats.lastSave);
            if (date) {
                restored.saveStats.lastSave = date;
            } else {
                restored.saveStats.lastSave = null;
            }
        }
    }
    
    // Restore Date objects in deviceInfo
    if (restored.deviceInfo && restored.deviceInfo.timestamp && typeof restored.deviceInfo.timestamp === 'string') {
        const date = safeStringToDate(restored.deviceInfo.timestamp);
        if (date) {
            restored.deviceInfo.timestamp = date;
        } else {
            restored.deviceInfo.timestamp = null;
        }
    }
    
    // ����������, ��� �������� ���� ����������
    restored.progress = restored.progress || {};
    restored.tasks = restored.tasks || [];
    restored.rewards = restored.rewards || [];
    restored.activityData = restored.activityData || {};
    restored.rewardPlan = restored.rewardPlan || { description: '' };
    
    // ���������� � ��������������� PIN-����
    restored.pinCodes = validatePinCodes(restored.pinCodes);
    
    console.log('? ��� ���� ������ �������������');
    return restored;
}

// Load state from Firestore
async function loadStateFromFirestore() {
    if (!isFirebaseAvailable()) {
        console.log('Firebase ����������, ��������� ������ ��������');
        return false;
    }

    try {
        console.log('?? �������� �������� �� Firebase...');
        
        // ������� ������� ��������� ����� ������
        let firestoreData = null;
        let dataSource = 'shared-data';
        
        try {
            const sharedRef = doc(db, 'shared-data', 'main');
            const sharedSnap = await getDoc(sharedRef);
            
            if (sharedSnap.exists()) {
                firestoreData = sharedSnap.data();
                console.log('?? ����� ������ ������� � Firebase');
            } else {
                // ���� ����� ������ ���, ������� ��������� ������ ������������
                const userRef = doc(db, 'users', appState.userName);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    firestoreData = userSnap.data();
                    dataSource = 'user-data';
                    console.log('?? ������ ������������ ������� � Firebase');
                } else {
                    console.log('?? ������ �� ������� � Firebase');
                    return false;
                }
            }
        } catch (error) {
            console.error('? ������ ��� �������� ������:', error);
            return false;
        }
        
        if (firestoreData) {
            console.log('?? ������ ��������� �� Firebase:', {
                source: dataSource,
                lastUpdated: firestoreData.lastUpdated,
                lastSavedBy: firestoreData.lastSavedBy,
                version: firestoreData.version,
                totalSaves: firestoreData.saveStats?.totalSaves || 0
            });
            
            // ��������������� ���� ������
            const restoredData = restoreDataTypes(firestoreData);
            
            // ��������� ������ ��������� ���������
            const localSettings = {
                userName: appState.userName,
                role: appState.role,
                isVerified: appState.isVerified,
                pinCodes: appState.pinCodes // ��������� PIN-���� ��������
            };
            
            // ��������� ��������� �������, ���� ��� ���� � ����������� ������
            if (restoredData.backupSettings) {
                console.log('?? ��������� ��������� ������� �� Firebase:', restoredData.backupSettings);
                localSettings.backupSettings = restoredData.backupSettings;
            }
            
            // ��������� ��������� ���������
            appState = { ...appState, ...restoredData, ...localSettings };
            
            // �������� ��������� backup PIN-����� �� Firebase
            await loadPinCodesFromFirebase();
            
            // ��������� UI
            updateProgressDisplay();
            renderTasks();
            renderRewards();
            generateCalendar();
            updateDayActivity();
            renderWeeklyChart();
            
            console.log('?? ������ ��������� �� Firebase, ������������� ��� ����������...');
            
            // ������ �������� ���� �����������
            
            // 1. ������������� ������ ������
            recalculateBestWeek();
            
            // 2. ��������� ��� �����������
            updateProgressDisplay();
            updateBestWeekDisplay();
            updateRedeemControls();
            updateProgressWeekSection();
            updateMonthlyProgressSection();
            updateWeeklyStars();
            updateAchievementsBank();
            
            // 3. ���������, ��� ��� ���������� ���������
            console.log('? ������ ������� ��������� �� Firebase, ��� ���������� �����������');
            
            // �������������� ���������� ��������� ��� �������� ������
            // saveDataToFirebase();
            
            // ����������� � �������� ������������ ������ ��� �������������
            
            // ���������� ��������� ���������� � ��������
            showLoadDetails(firestoreData);
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('? ������ �������� �� Firebase:', error);
        
        // ��������� ��� ������
        if (error.message && error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
            console.warn('?? ������ ������������ �������� (��������, ����������� �������)');
            showNotification('Firebase ������������ ������������� �������', 'warning');
        } else if (error.code === 'permission-denied') {
            console.warn('?? �������� � ������� � Firestore');
            showNotification('�������� � ������� � Firestore', 'error');
        } else if (error.code === 'unavailable') {
            console.warn('?? Firestore ����������');
            showNotification('Firestore ����������', 'error');
        } else if (error.code === 'not-found') {
            console.warn('?? �������� �� ������ � Firestore');
            showNotification('������ �� ������� � Firebase', 'info');
        } else {
            showNotification('������ �������� �� Firebase', 'error');
        }
        
        return false;
    }
}

// Retry mechanism for Firebase operations
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`?? ������� ${attempt}/${maxRetries}...`);
            return await operation();
        } catch (error) {
            console.warn(`?? ������� ${attempt} �� �������:`, error.message);
            
            if (attempt === maxRetries) {
                console.error(`? ��� ${maxRetries} ������� �� �������`);
                throw error;
            }
            
            // ���������������� �������� ����� ���������
            const waitTime = delay * Math.pow(2, attempt - 1);
            console.log(`? �������� ${waitTime}ms ����� ��������� ��������...`);
            await new Promise(resolve => safeSetTimeout(resolve, waitTime));
        }
    }
}

// Sync state with Firestore
async function syncWithFirestore() {
    if (!navigator.onLine) {
        console.log('��� ��������-����������, ������������� ��������');
        showNotification('��� ��������-����������', 'warning');
        return false;
    }

    if (!isFirebaseAvailable()) {
        console.log('Firebase ����������, ������������� ��������');
        showNotification('Firebase ����������', 'warning');
        return false;
    }

    try {
        console.log('?? �������� ������������� � Firebase...');
        
        // ���������� ��������� �������������
        showSyncStatus('syncing');
        
        // ���������� �������� �������������
        showNotification('�������������...', 'info');
        
        // ������� ��������� ������ �� Firestore � retry
        const loadResult = await retryOperation(async () => {
            return await loadStateFromFirestore();
        }, 3, 1000);
        
        if (loadResult) {
            console.log('? ����� ������ ��������� �� Firebase');
            showNotification('������ ��������� �� Firebase', 'success');
            
            // ����� ��������� ������� ��������� � retry
            const saveResult = await retryOperation(async () => {
                return await saveStateToFirestore(false);
            }, 3, 1000);
            
            if (saveResult) {
                console.log('? ������������� ��������� �������');
                showNotification('������������� ��������� �������', 'success');
                
                // ���������� �������� ������
                showSyncStatus('success');
                
                // ���������� ������ �������������
                showSyncSummary();
                
                console.log('?? ������������� ��������� �������, ������������� ��� ����������...');
                
                // ������ �������� ���� �����������
                
                // 1. ������������� ������ ������
                recalculateBestWeek();
                
                // 2. ��������� ��� �����������
                updateProgressDisplay();
                updateBestWeekDisplay();
                updateRedeemControls();
                updateProgressWeekSection();
                updateMonthlyProgressSection();
                updateWeeklyStars();
                
                // 3. ���������, ��� ��� ���������� ���������
                console.log('? ������������� ��������� �������, ��� ���������� �����������');
                
                // ��������� ����������� ������� ��������
                updateLearningTimeDisplay();
                
                // �������������� ���������� ��������� ��� �������������
                // saveDataToFirebase();
            } else {
                console.log('?? ������������� ��������� � ����������������');
                showNotification('������������� ��������� � ����������������', 'warning');
                
                // ���������� ������ � ����������������
                showSyncStatus('error', '� ����������������');
            }
        } else {
            console.log('?? �� ������� ��������� ����� ������ �� Firebase');
            showNotification('�� ������� ��������� ������ �� Firebase', 'warning');
            
            // ���������� ������ ������
            showSyncStatus('error', '�� ������� ���������');
        }
        
        return true;
    } catch (error) {
        console.error('? ������ ������������� ����� ���� �������:', error);
        showNotification(`������ �������������: ${error.message}`, 'error');
        
        // ���������� ������ ������
        showSyncStatus('error', error.message);
        
        return false;
    }
}

// Show save details modal
function showSaveDetails(data) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>?? ����� ������ ��������� � Firebase</h3>
            </div>
            <div class="modal-body">
                <div class="save-details">
                    <div class="detail-item">
                        <strong>��������� �������������:</strong> ${data.userName || '�� ������'}
                    </div>
                    <div class="detail-item">
                        <strong>����� ����������:</strong> ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleString('ru-RU') : '�� �������'}
                    </div>
                    <div class="detail-item">
                        <strong>����� ����������:</strong> ${data.saveStats?.totalSaves || 0}
                    </div>
                    <div class="detail-item">
                        <strong>������:</strong> ${data.version || '�� �������'}
                    </div>
                    <div class="detail-item">
                        <strong>��� ������:</strong> ����� ������ ��� ���� �������������
                    </div>
                    <div class="detail-item">
                        <strong>�������:</strong> ${data.tasks?.length || 0}
                    </div>
                    <div class="detail-item">
                        <strong>������:</strong> ${data.rewards?.length || 0}
                    </div>
                    <div class="detail-item">
                        <strong>����������:</strong> ${Object.keys(data.activityData || {}).length} ����
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="text-align: center;">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Show load details modal
function showLoadDetails(data) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>?? ����� ������ ��������� �� Firebase</h3>
            </div>
            <div class="modal-body">
                <div class="load-details">
                    <div class="detail-item">
                        <strong>��������� ����������:</strong> ${data.lastUpdated ? new Date(data.lastUpdated).toLocaleString('ru-RU') : '�� �������'}
                    </div>
                    <div class="detail-item">
                        <strong>��� ��������:</strong> ${data.lastSavedBy || '�� �������'}
                    </div>
                    <div class="detail-item">
                        <strong>����� ����������:</strong> ${data.saveStats?.totalSaves || 0}
                    </div>
                    <div class="detail-item">
                        <strong>������:</strong> ${data.version || '�� �������'}
                    </div>
                    <div class="detail-item">
                        <strong>�������:</strong> ${data.tasks?.length || 0}
                    </div>
                    <div class="detail-item">
                        <strong>������:</strong> ${data.rewards?.length || 0}
                    </div>
                    <div class="detail-item">
                        <strong>����������:</strong> ${Object.keys(data.activityData || {}).length} ����
                    </div>
                    <div class="detail-item">
                        <strong>��� ������:</strong> ����� ������ ��� ���� �������������
                    </div>
                </div>
            </div>
            <div class="modal-footer centered">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">��</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Firebase diagnostics
function diagnoseFirebaseIssues() {
    const issues = [];
    
    // ��������� ����������� Firebase
    if (!isFirebaseAvailable()) {
        issues.push('? Firebase SDK ����������');
    }
    
    // ��������� ��������-����������
    if (!navigator.onLine) {
        issues.push('? ��� ��������-����������');
    }
    
    // ��������� ������������
    const adBlockers = [
        'AdBlock',
        'uBlock',
        'AdBlock Plus',
        'Ghostery',
        'Privacy Badger'
    ];
    
    const hasAdBlocker = adBlockers.some(name => 
        window[name] || 
        document.querySelector(`[class*="${name.toLowerCase()}"]`) ||
        document.querySelector(`[id*="${name.toLowerCase()}"]`)
    );
    
    if (hasAdBlocker) {
        issues.push('?? ��������� ����������� �������');
    }
    
    // ��������� ���������� ��������
    if (navigator.userAgent.includes('Chrome')) {
        issues.push('?? ������������ Chrome (��������� ����������)');
    } else if (navigator.userAgent.includes('Firefox')) {
        issues.push('?? ������������ Firefox (��������� ����������)');
    }
    
    return issues;
}

// Show Firebase diagnostics modal
function showFirebaseDiagnostics() {
    const issues = diagnoseFirebaseIssues();
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>?? ����������� Firebase</h3>
                <button class="modal-close" onclick="this.closest('.modal').remove()">?</button>
            </div>
            <div class="modal-body">
                <div class="diagnostics-info">
                    <div class="diagnostic-item">
                        <strong>������ Firebase:</strong> 
                        ${isFirebaseAvailable() ? '? ��������' : '? ����������'}
                    </div>
                    <div class="diagnostic-item">
                        <strong>��������:</strong> 
                        ${navigator.onLine ? '? ���������' : '? ��������'}
                    </div>
                    <div class="diagnostic-item">
                        <strong>������������:</strong> 
                        ${appState.userName || '�� ������'}
                    </div>
                    <div class="diagnostic-item">
                        <strong>�����������:</strong> 
                        ${appState.isVerified ? '? �������������' : '? �� �������������'}
                    </div>
                </div>
                
                ${issues.length > 0 ? `
                    <div class="diagnostics-issues">
                        <h4>?? ������������ ��������:</h4>
                        <ul>
                            ${issues.map(issue => `<li>${issue}</li>`).join('')}
                        </ul>
                    </div>
                ` : `
                    <div class="diagnostics-success">
                        <h4>? ������� �� ����������</h4>
                    </div>
                `}
                
                <div class="diagnostics-solutions">
                    <h4>?? ��������� �������:</h4>
                    <ul>
                        <li>��������� ����������� ������� ��� ����� �����</li>
                        <li>��������� ���������� ��������</li>
                        <li>���������, ��� ��������-���������� ���������</li>
                        <li>���������� ������ �������</li>
                    </ul>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">OK</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Show sync summary modal
function showSyncSummary() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>?? ������������� ���������</h3>
            </div>
            <div class="modal-body">
                <div class="sync-summary">
                    <div class="summary-item success">
                        <span class="summary-icon">?</span>
                        <span class="summary-text">����� ������ ��������� �� Firebase</span>
                    </div>
                    <div class="summary-item success">
                        <span class="summary-icon">??</span>
                        <span class="summary-text">������� ��������� ��������� � Firebase</span>
                    </div>
                    <div class="summary-item info">
                        <span class="summary-icon">??</span>
                        <span class="summary-text">������������� ��������� �������</span>
                    </div>
                    <div class="summary-item info">
                        <span class="summary-icon">??</span>
                        <span class="summary-text">�����: ${new Date().toLocaleString('ru-RU')}</span>
                    </div>
                    <div class="summary-item info">
                        <span class="summary-icon">??</span>
                        <span class="summary-text">������ ���������������� ��� ���� �������������</span>
                    </div>
                    <div class="summary-item info">
                        <span class="summary-icon">??</span>
                        <span class="summary-text">�������� �������� ��� ���� ������� �������</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer centered">
                <button class="btn btn-primary" onclick="this.closest('.modal').remove()">����������</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Show sync status indicator
function showSyncStatus(status, message = '') {
    // ������� ������������ ���������
    const existingIndicator = document.getElementById('syncStatusIndicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    const indicator = document.createElement('div');
    indicator.id = 'syncStatusIndicator';
    indicator.className = `sync-status-indicator ${status}`;
    
    let icon, text;
    switch (status) {
        case 'syncing':
            icon = '??';
            text = '�������������...';
            break;
        case 'success':
            icon = '?';
            text = '����������������';
            break;
        case 'error':
            icon = '?';
            text = '������ �������������';
            break;
        case 'offline':
            icon = '??';
            text = '������ �����';
            break;
        default:
            icon = '??';
            text = message || '������';
    }

    indicator.innerHTML = `
        <span class="sync-icon">${icon}</span>
        <span class="sync-text">${text}</span>
        ${status === 'syncing' ? '<div class="sync-spinner"></div>' : ''}
    `;

    // ��������� � ������ ������� ����
    document.body.appendChild(indicator);
    
    // ������������� �������� ����� 3 ������� ��� �������� ��������
    if (status === 'success') {
        safeSetTimeout(() => {
            if (indicator.parentNode) {
                indicator.remove();
            }
        }, 3000);
    }
}

// Update sync status based on connection
function updateSyncStatus() {
    if (!navigator.onLine) {
        showSyncStatus('offline');
    } else if (!isFirebaseAvailable()) {
        showSyncStatus('error', 'Firebase ����������');
    } else {
        showSyncStatus('success');
    }
}

// Check if first time sync is needed
async function checkFirstTimeSync() {
    // ���������, ���� �� ��� ��������� �������������
    const hasSyncedBefore = localStorage.getItem('has-synced-before');
    
    // ��������� ������������� ������ ����������� ��� �������
    // ���� ������������ ��� �� �������������
    if (!appState.isVerified && navigator.onLine && isFirebaseAvailable()) {
        console.log('?? ��������� ������������� ��������� �������������...');
        
        if (!hasSyncedBefore) {
            console.log('?? ��������� �������������...');
            
            // ������� ������� ����������� ������ ������
            const migrationResult = await migrateUserDataToShared();
            if (migrationResult) {
                console.log('? �������� ������ ��������� �������');
            }
            
            // ���������� ��������� ���� ��������� �������������
            showFirstTimeSyncModal();
        } else {
            // ���� ������������� ��� ����, �� ������������ �� �������������,
            // ���������� ���������������� ������
            console.log('?? ������������ �� �������������, ���������� �������������');
            showSyncPrompt();
        }
    }
}

// Show first time sync modal
function showFirstTimeSyncModal() {
    // �������� ���
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    if (overlay) overlay.classList.add('show');
    if (container) container.classList.add('hidden');
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'firstTimeSyncModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>?? ��������� �������������</h3>
            </div>
            <div class="modal-body">
                <div class="sync-animation">
                    <div class="sync-spinner">??</div>
                    <p>��������� ��������� ������ �� Firebase...</p>
                    <div class="sync-progress">
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // ��������� �������� � �������������
    startFirstTimeSync();
}

// Start first time sync
async function startFirstTimeSync() {
    try {
        // �������� ���������
        const progressFill = document.querySelector('.progress-fill');
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 2;
            if (progressFill) progressFill.style.width = progress + '%';
            if (progress >= 100) clearInterval(progressInterval);
        }, 50);
        
        // ��������� ������������� ����������
        syncWithFirestore().then(syncResult => {
            // ������������� ��������
            clearInterval(progressInterval);
            if (progressFill) progressFill.style.width = '100%';
            
            if (syncResult) {
                console.log('?? ��������� ������������� ��������� �������, ������������� ��� ����������...');
                
                // ������ �������� ���� �����������
                
                // 1. ������������� ������ ������
                recalculateBestWeek();
                
                // 2. ��������� ��� �����������
                updateProgressDisplay();
                updateBestWeekDisplay();
                updateRedeemControls();
                updateProgressWeekSection();
                updateMonthlyProgressSection();
                updateWeeklyStars();
                
                // 3. ���������, ��� ��� ���������� ���������
                console.log('? ��������� ������������� ���������, ��� ���������� �����������');
                
                // �������������� ���������� ��������� ��� ��������� �������������
                // saveDataToFirebase();
                
                // ���������� �������� �������������
                showFirstTimeSyncSuccess();
                
                // ��������, ��� ��������� ������������� ���������
                localStorage.setItem('has-synced-before', 'true');
            } else {
                // ���������� ������ �������������
                showFirstTimeSyncError();
            }
        }).catch(error => {
            console.error('? ������ ��������� �������������:', error);
            clearInterval(progressInterval);
            showFirstTimeSyncError();
        });
        
    } catch (error) {
        console.error('? ������ ������� �������������:', error);
        showFirstTimeSyncError();
    }
}

// Show sync prompt for non-verified users
function showSyncPrompt() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'syncPromptModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>?? ������������� ������</h3>
            </div>
            <div class="modal-body">
                <p>��� ����� � ������� ���������� ���������������� ������ � Firebase.</p>
                <p>��� ��������� ������������ ������ ��������� � ��������.</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="startManualSync()">
                    ?? ����������������
                </button>
                <button class="btn btn-secondary" onclick="closeSyncPrompt()">
                    �����
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // �������� ���
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    if (overlay) overlay.classList.add('show');
    if (container) container.classList.add('hidden');
}

// Start manual sync
async function startManualSync() {
    closeSyncPrompt();
    showFirstTimeSyncModal();
}

// Close sync prompt
function closeSyncPrompt() {
    const modal = document.getElementById('syncPromptModal');
    if (modal) {
        modal.remove();
    }
    
    // ���������� ���
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    if (overlay) overlay.classList.remove('show');
    if (container) container.classList.remove('hidden');
}

// Show first time sync success
function showFirstTimeSyncSuccess() {
    const modal = document.getElementById('firstTimeSyncModal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>? ������������� ���������</h3>
            </div>
            <div class="modal-body">
                <div class="sync-success">
                    <div class="success-icon">?</div>
                    <p>������ ������� ��������� �� Firebase!</p>
                    <p>������ �� ������ �������� � ���������� ������������ �������.</p>
                </div>
            </div>
            <div class="modal-footer centered">
                <button class="btn btn-primary" onclick="closeFirstTimeSyncModal()">����������</button>
            </div>
        </div>
    `;
}

// Show first time sync error
function showFirstTimeSyncError() {
    const modal = document.getElementById('firstTimeSyncModal');
    if (!modal) return;
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>?? ������ �������������</h3>
            </div>
            <div class="modal-body">
                <div class="sync-error">
                    <div class="error-icon">??</div>
                    <p>�� ������� ��������� ������ �� Firebase.</p>
                    <p>�� ������ ���������� ������ � ���������� ������� ��� ����������� ������������������ �����.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeFirstTimeSyncModal()">����������</button>
            </div>
        </div>
    `;
}

// Close first time sync modal
function closeFirstTimeSyncModal() {
    const modal = document.getElementById('firstTimeSyncModal');
    if (modal) {
        modal.remove();
    }
    
    // ���������� ���
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    if (overlay) overlay.classList.remove('show');
    if (container) container.classList.remove('hidden');
}

// Show account selection modal
function showAccountSelection() {
    console.log('?? ���������� ����� ������� ������');
    
    console.log('?? ���������� ����� ������� ������, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ����� ������� ������ ������� ������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? ����� ������� ������ �������, ��� ���������� �����������');
    
                            // ��������� ���� ��� ����������� ����������� ������ ��������
            applyRolePermissions();
            
            // ��������������� ��������� ������ (��� �������� �� ���������)
            restoreSettingsBlocksState();
            
            // �������������� ���������� ��������� ��� ������ ������ ������� ������
            // saveDataToFirebase();
            
            document.getElementById('accountModal').classList.add('show');
    const overlay = document.getElementById('modalOverlay');
    const container = document.querySelector('.container');
    if (overlay) overlay.classList.add('show');
    if (container) container.classList.add('hidden');
}

// Migrate old user data to shared collection
async function migrateUserDataToShared() {
    if (!isFirebaseAvailable() || !navigator.onLine) {
        return false;
    }
    
    try {
        console.log('?? �������� �������� ������...');
        
        // ������� ��������� ������ Admin
        const adminRef = doc(db, 'users', 'Admin');
        const adminSnap = await getDoc(adminRef);
        
        // ������� ��������� ������ �������
        const mikhailRef = doc(db, 'users', '������');
        const mikhailSnap = await getDoc(mikhailRef);
        
        let bestData = null;
        let source = 'none';
        
        if (adminSnap.exists() && mikhailSnap.exists()) {
            // ���� ���� ������ ����� �������������, �������� ����� ������
            const adminData = adminSnap.data();
            const mikhailData = mikhailSnap.data();
            
            const adminTime = adminData.lastUpdated ? new Date(adminData.lastUpdated) : new Date(0);
            const mikhailTime = mikhailData.lastUpdated ? new Date(mikhailData.lastUpdated) : new Date(0);
            
            if (adminTime > mikhailTime) {
                bestData = adminData;
                source = 'Admin';
            } else {
                bestData = mikhailData;
                source = '������';
            }
            
            console.log(`?? ������� ������ �� ${source} (����� ������)`);
        } else if (adminSnap.exists()) {
            bestData = adminSnap.data();
            source = 'Admin';
            console.log('?? ������� ������ Admin');
        } else if (mikhailSnap.exists()) {
            bestData = mikhailSnap.data();
            source = '������';
            console.log('?? ������� ������ �������');
        }
        
        if (bestData) {
            // ��������� � ����� ���������
            const sharedRef = doc(db, 'shared-data', 'main');
            const dataToSave = {
                ...bestData,
                lastUpdated: new Date().toISOString(),
                lastSavedBy: 'Migration',
                migratedFrom: source,
                version: '1.0'
            };
            
            await setDoc(sharedRef, dataToSave, { merge: true });
            console.log(`? ������ ������� ����������� �� ${source} � ����� ���������`);
            
            // ������� ������ ������ �������������
            if (adminSnap.exists()) {
                await setDoc(adminRef, { deleted: true, migratedAt: new Date().toISOString() });
            }
            if (mikhailSnap.exists()) {
                await setDoc(mikhailRef, { deleted: true, migratedAt: new Date().toISOString() });
            }
            
            console.log('?? �������� ���������, ������������� ��� ����������...');
            
            // ������ �������� ���� �����������
            
            // 1. ������������� ������ ������
            recalculateBestWeek();
            
            // 2. ��������� ��� �����������
            updateProgressDisplay();
            updateBestWeekDisplay();
            updateRedeemControls();
            updateProgressWeekSection();
            updateMonthlyProgressSection();
            updateWeeklyStars();
            
            // 3. ���������, ��� ��� ���������� ���������
            console.log('? �������� ���������, ��� ���������� �����������');
            
            // �������������� ���������� ��������� ��� �������� ������
            // saveDataToFirebase();
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('? ������ �������� ������:', error);
        return false;
    }
}

// Test Firebase connection
async function testFirebaseConnection() {
    if (!isFirebaseAvailable()) {
        console.log('? Firebase ����������');
        return false;
    }

    try {
        console.log('?? ��������� ����������� � Firebase...');
        
        // ������� ������� �������� ��������
        const testRef = doc(db, 'test', 'connection-test');
        await setDoc(testRef, {
            timestamp: new Date().toISOString(),
            message: 'Connection test'
        });
        
        console.log('? ����������� � Firebase ��������!');
        
        // ������� �������� ��������
        await setDoc(testRef, {
            timestamp: new Date().toISOString(),
            message: 'Connection test - cleaned up'
        });
        
        return true;
    } catch (error) {
        console.error('? ������ ����������� � Firebase:', error);
        
        // ��������� ��� ������
        if (error.message && error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
            console.warn('?? ������ ������������ �������� (��������, ����������� �������)');
            showNotification('Firebase ������������ ������������� �������', 'warning');
        } else if (error.code === 'permission-denied') {
            console.warn('?? �������� � ������� � Firestore');
            showNotification('�������� � ������� � Firestore', 'error');
        } else if (error.code === 'unavailable') {
            console.warn('?? Firestore ����������');
            showNotification('Firestore ����������', 'error');
        }
        
        return false;
    }
}

// Auto-sync manager
let autoSyncInterval = null;

function startAutoSync() {
    // ����������������� ��������� - ������������� ������ �� ������
    console.log('����������������� ���������');
}

        function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
        console.log('����������������� �����������');
    }
}

// PWA ������������� � ���������
let deferredPrompt = null;
let isPWAInstalled = false;

// ������������� ������� ��������� PWA
async function installPWA() {
    console.log('?? ������� ��������� PWA...');
    
    // ���������, ����������� �� ��� ����������
    if (isPWAInstalled || window.matchMedia('(display-mode: standalone)').matches) {
        showNotification('���������� ��� �����������!', 'info');
        return;
    }

    // ��� iOS Safari - ���������� ����������
    if (isIOS()) {
        showIOSInstallInstructions();
        return;
    }

    // ��� Android � Desktop - �������������� ���������
    try {
        // ������� ������� ������������ deferredPrompt
        if (deferredPrompt) {
            console.log('?? ���������� deferredPrompt ��� ���������');
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('?? PWA: ��������� ���������:', outcome);
            
            if (outcome === 'accepted') {
                showNotification('���������� �����������!', 'success');
                isPWAInstalled = true;
                updatePWAInstallButton();
            } else {
                showNotification('��������� ��������', 'info');
            }
            
        deferredPrompt = null;
            return;
        }

        // ���� deferredPrompt ����������, ������� �������������� ���������
        console.log('?? �������������� ��������� PWA...');
        
        // ���������� ����������� � ������� ���������
        showNotification('������� ���������...', 'info');
        
        // ������� ��������� �������� ���������
        await tryMultipleInstallMethods();
        
    } catch (error) {
        console.error('������ ��������� PWA:', error);
        showNotification('������ ���������. ���������� ����������...', 'warning');
        showManualInstallInstructions();
    }
}

// �������� iOS
function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// �������� Android
function isAndroid() {
    return /Android/.test(navigator.userAgent);
}

// ������������� ������� ��������� PWA
async function tryMultipleInstallMethods() {
    console.log('?? ������� ������ ������� ���������...');
    
    // ���������, ��� �� �� HTTP/HTTPS, � �� file://
    if (window.location.protocol === 'file:') {
        showNotification('��� ��������� PWA �������� ���������� ����� HTTP ������!', 'warning');
        showManualInstallInstructions();
        return;
    }
    
    // ������ 1: ������ ������� ��������� ����� �������
    console.log('?? ������ 1: ������ ���������');
    try {
        // ���������� ������ ���������
        const installConfirmed = confirm('���������� ���������� "English Learning"?');
        
        if (installConfirmed) {
            // ������� ������������ deferredPrompt ���� �� ����
            if (deferredPrompt) {
                console.log('?? ���������� ����������� deferredPrompt');
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    showNotification('���������� �����������!', 'success');
                    isPWAInstalled = true;
                    updatePWAInstallButton();
                    return;
                } else {
                    showNotification('��������� ��������', 'info');
                    return;
                }
            }
            
            // ���� deferredPrompt ���, ���������� ����������
            showNotification('�������������� ��������� ����������. ���������� ����������...', 'info');
            setTimeout(() => {
                showManualInstallInstructions();
            }, 1000);
            
        } else {
            showNotification('��������� ��������', 'info');
        }
        
    } catch (e) {
        console.log('������ 1 �� ��������:', e);
    }
    
    // ������ 2: ������� ����� ��������� URL
    console.log('?? ������ 2: ��������� URL');
    try {
        const currentUrl = window.location.href;
        const newUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'install=true';
        
        // �������� �������� URL ��� �������������� ���������
        window.history.replaceState({}, '', newUrl);
        
        setTimeout(() => {
            window.history.replaceState({}, '', currentUrl);
        }, 2000);
        
    } catch (e) {
        console.log('������ 2 �� ��������:', e);
    }
    
    // ������ 3: ������� ����� service worker
    console.log('?? ������ 3: service worker');
    try {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            if (registration && registration.active) {
                // ���������� ��������� service worker
                registration.active.postMessage({ 
                    type: 'FORCE_INSTALL',
                    timestamp: Date.now()
                });
            }
        }
    } catch (e) {
        console.log('������ 3 �� ��������:', e);
    }
    
    // ������ 4: ������� ����� ��������
    console.log('?? ������ 4: ���������� ���������');
    try {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            const originalHref = manifestLink.href;
            manifestLink.href = originalHref + '?v=' + Date.now();
            
            setTimeout(() => {
                manifestLink.href = originalHref;
            }, 1000);
        }
    } catch (e) {
        console.log('������ 4 �� ��������:', e);
    }
    
    // ���� ��������� ���������
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ���������, ������������ �� ����������
    if (window.matchMedia('(display-mode: standalone)').matches) {
        isPWAInstalled = true;
        updatePWAInstallButton();
        showNotification('���������� �����������!', 'success');
    } else {
        // ���� �� ������������, ���������� ����������
        showNotification('�������������� ��������� �� �������. ���������� ����������...', 'warning');
        setTimeout(() => {
            showManualInstallInstructions();
        }, 1000);
    }
}

// �������� ���������� ��� iOS
function showIOSInstallInstructions() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3 class="modal-title">?? ��������� �� iPhone/iPad</h3>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <p><strong>��� ��������� ���������� �� iPhone ��� iPad:</strong></p>
                </div>
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span style="background: #1e40af; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">1</span>
                        <span>������� ������ <strong>"����������"</strong> ����� ������</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span style="background: #1e40af; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">2</span>
                        <span>�������� <strong>"�� ����� �����"</strong></span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <span style="background: #1e40af; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">3</span>
                        <span>������� <strong>"��������"</strong></span>
                    </div>
                </div>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #1e40af;">
                        ?? <strong>�����:</strong> ����� ��������� ���������� �������� �� ������� ������ ��� ������� ����������!
                    </p>
                </div>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; padding: 0 20px 20px;">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">�������</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// �������� ���������� ��� ������ ���������
function showManualInstallInstructions() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3 class="modal-title">?? ��������� ����������</h3>
            </div>
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <p><strong>��� ��������� ���������� �� ��� ���������:</strong></p>
                </div>
                
                <!-- Chrome/Edge -->
                <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #1e40af;">
                    <h4 style="margin: 0 0 10px 0; color: #1e40af;">?? Chrome / Edge</h4>
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="background: #1e40af; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">1</span>
                        <span>������� ������ <strong>"����������"</strong> � �������� ������ (������)</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="background: #1e40af; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">2</span>
                        <span>��� ���� �������� > <strong>"���������� ����������"</strong></span>
                    </div>
                </div>
                
                <!-- Firefox -->
                <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #ff6b35;">
                    <h4 style="margin: 0 0 10px 0; color: #ff6b35;">?? Firefox</h4>
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="background: #ff6b35; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">1</span>
                        <span>���� �������� > <strong>"����������"</strong></span>
                    </div>
                </div>
                
                <!-- Safari -->
                <div style="margin-bottom: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #007aff;">
                    <h4 style="margin: 0 0 10px 0; color: #007aff;">?? Safari</h4>
                    <div style="display: flex; align-items: center; margin-bottom: 8px;">
                        <span style="background: #007aff; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px;">1</span>
                        <span>���� "����" > <strong>"�������� �� ����� �����"</strong></span>
                    </div>
                </div>
                
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 14px; color: #1e40af;">
                        ?? <strong>�����:</strong> ���������, ��� ���������� ������� ����� HTTP ������ (http://localhost:8000), � �� ��� ����!
                    </p>
                </div>
                
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">
                        ?? <strong>���� ������ ��������� �� ����������:</strong> �������� �������� (F5) � ��������� ��������� ������.
                    </p>
                </div>
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 20px; padding: 0 20px 20px;">
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">�������</button>
                <button class="btn btn-warning" onclick="forceInstallPWA()">? ���������� �������������</button>
                <button class="btn btn-primary" onclick="window.location.reload()">?? �������� ��������</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// �������������� ��������� PWA
async function forceInstallPWA() {
    console.log('? �������������� ��������� PWA...');
    
    // ���������, ��� �� �� HTTP/HTTPS
    if (window.location.protocol === 'file:') {
        showNotification('��� ��������� PWA �������� ���������� ����� HTTP ������!', 'error');
        return;
    }
    
    showNotification('������ �������������� ���������...', 'info');
    
    try {
        // ������ 1: ������� ����� beforeinstallprompt
        if (deferredPrompt) {
            console.log('? ���������� deferredPrompt ��� �������������� ���������');
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                showNotification('���������� �����������!', 'success');
                isPWAInstalled = true;
                updatePWAInstallButton();
                return;
            }
        }
        
        // ������ 2: �������������� �������� ������� ���������
        console.log('? ������� �������������� ������� ���������');
        const installEvent = new CustomEvent('beforeinstallprompt', {
            detail: {
                prompt: async () => {
                    return new Promise((resolve) => {
                        const confirmed = confirm('���������� ���������� "English Learning" �������������?');
                        resolve({ outcome: confirmed ? 'accepted' : 'dismissed' });
                    });
                }
            }
        });
        
        window.dispatchEvent(installEvent);
        
        // ������ 3: ������� ����� ��������� ���������
        console.log('? ��������� �������� ��� �������������� ���������');
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            const originalHref = manifestLink.href;
            manifestLink.href = originalHref + '?force=' + Date.now();
            
            setTimeout(() => {
                manifestLink.href = originalHref;
            }, 2000);
        }
        
        // ������ 4: ������� ����� service worker
        console.log('? ���������� ��������� service worker');
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                if (registration && registration.active) {
                    registration.active.postMessage({ 
                        type: 'FORCE_INSTALL',
                        timestamp: Date.now(),
                        force: true
                    });
                }
            } catch (e) {
                console.log('Service worker ��������� �� ���������:', e);
            }
        }
        
        // ������ 5: ������� ����� ��������� URL
        console.log('? �������� URL ��� �������������� ���������');
        const currentUrl = window.location.href;
        const newUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'force_install=true';
        window.history.replaceState({}, '', newUrl);
        
        setTimeout(() => {
            window.history.replaceState({}, '', currentUrl);
        }, 3000);
        
        // ������ 6: ������� ����� �������� �������� iframe
        console.log('? ������� ������� iframe ��� �������������� ���������');
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = window.location.href + '?install_force=true';
        document.body.appendChild(iframe);
        
        setTimeout(() => {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }, 2000);
        
        // ���� ���������
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // ���������, ������������ �� ����������
        if (window.matchMedia('(display-mode: standalone)').matches) {
            isPWAInstalled = true;
            updatePWAInstallButton();
            showNotification('���������� ����������� �������������!', 'success');
        } else {
            showNotification('�������������� ��������� �� �������. ���������� ������ ���������.', 'warning');
        }
        
    } catch (error) {
        console.error('������ �������������� ���������:', error);
        showNotification('������ �������������� ���������: ' + error.message, 'error');
    }
}

// �������� ��������� ������ ���������
function updatePWAInstallButton() {
    const installItem = document.getElementById('pwaInstallMenuItem');
    if (installItem) {
        if (isPWAInstalled || window.matchMedia('(display-mode: standalone)').matches) {
            installItem.innerHTML = '? ���������� �����������';
            installItem.style.color = '#10b981';
            installItem.onclick = null;
        } else {
            installItem.innerHTML = '?? ���������� ����������';
            installItem.style.color = '';
            installItem.onclick = installPWA;
        }
    }
}

// ������������� PWA
function initPWA() {
    console.log('?? ������������� PWA...');
    
    // ���������� ������� beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('?? PWA: beforeinstallprompt ��������');
        e.preventDefault();
        deferredPrompt = e;
        updatePWAInstallButton();
    });
    
    // ���������� ������� appinstalled
    window.addEventListener('appinstalled', () => {
        console.log('?? PWA: ���������� �����������');
        isPWAInstalled = true;
        updatePWAInstallButton();
        showNotification('���������� ������� �����������!', 'success');
    });
    
    // ���������, ����������� �� ��� ����������
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('?? PWA: ���������� ��� �����������');
        isPWAInstalled = true;
    }
    
    updatePWAInstallButton();
}


// Initialize the app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

        
// ������� ��� �������������� ��������� ������ ��������
function restoreSettingsBlocksState() {
    try {
        const blockTitles = document.querySelectorAll('.settings-block-title');
        blockTitles.forEach(blockTitle => {
            const blockName = blockTitle.textContent.trim();
            const blockContent = blockTitle.nextElementSibling;
            
            if (blockContent && blockContent.classList.contains('settings-block-content')) {
                // ������ ����������� ����� ��� �������/����������
                blockContent.classList.remove('expanded');
                blockContent.classList.add('collapsed');
                blockTitle.classList.add('collapsed');
                console.log('?? ���� ������� ��� �������:', blockName);
            }
        });
        
        // ������� ����������� ���������, ����� ��� �� ������
        const blockNames = ['�������� ���������', '���������� PIN-������', 'Firebase ��������', '����������� �����������', '���������� �������', '������� ��������'];
        blockNames.forEach(name => {
            localStorage.removeItem(`settings-block-${name}`);
        });
        
        console.log('? ��� ����� ���� �������� �� ���������');
    } catch (error) {
        console.error('? ������ �������������� ��������� ������ ��������:', error);
    }
}

// ������� ��� ������������ ������ ��������
function toggleSettingsBlock(blockTitle) {
    const blockContent = blockTitle.nextElementSibling;
    if (blockContent && blockContent.classList.contains('settings-block-content')) {
        const isCurrentlyCollapsed = blockContent.classList.contains('collapsed');
        
        if (isCurrentlyCollapsed) {
            // ������������� ����
            blockContent.classList.remove('collapsed');
            blockContent.classList.add('expanded');
            blockTitle.classList.remove('collapsed');
            console.log('?? ���� ���������:', blockTitle.textContent.trim());
        } else {
            // ����������� ����
            blockContent.classList.remove('expanded');
            blockContent.classList.add('collapsed');
            blockTitle.classList.add('collapsed');
            console.log('?? ���� �������:', blockTitle.textContent.trim());
        }
    }
}

// Make new functions globally available
window.savePinCodesToFirebase = savePinCodesToFirebase;
window.loadPinCodesFromFirebase = loadPinCodesFromFirebase;
window.validatePinCodes = validatePinCodes;
window.showSyncStatus = showSyncStatus;
window.updateSyncStatus = updateSyncStatus;
window.retryOperation = retryOperation;
window.forceSyncPinCodes = forceSyncPinCodes;
window.checkDeviceCapabilities = checkDeviceCapabilities;
window.forceRestorePinCodes = forceRestorePinCodes;
window.saveDataToFirebase = saveDataToFirebase;

// ���������� ������� ��� ������ ����������� ����� �������������
window.showVerificationAfterSync = () => {
    console.log('?? ��������� PIN-���� ��� ������ �����������...');
    
    // ���������, ��������� �� PIN-���� �� Firebase
    if (Object.keys(appState.pinCodes).length === 0) {
        console.log('? PIN-���� �� ��������� �� Firebase');
        showNotification('PIN-���� �� ���������. ��������� ��������-����������.', 'error');
        
        // ���������� ����� ������� ������, ���� PIN-���� �� ���������
        showAccountSelection();
        return;
    }
    
    // ���������, ���� �� � ������������ PIN-���
    const hasPin = appState.pinCodes[appState.userName];
    console.log(`?? ��������� �������� PIN-���� ��� ${appState.userName}:`, hasPin ? '������' : '�� ������');
    
    if (hasPin) {
        // ���� PIN-��� ����, ���������� �����������
        console.log('?? PIN-��� ������, ���������� �����������');
        
        console.log('?? ���������� �����������, ������������� ��� ����������...');
        
        // ������ �������� ���� ����������� ����� ������� �����������
        
        // 1. ������������� ������ ������
        recalculateBestWeek();
        
        // 2. ��������� ��� �����������
        updateProgressDisplay();
        updateBestWeekDisplay();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        
                        // 3. ���������, ��� ��� ���������� ���������
    console.log('? ����������� ��������, ��� ���������� �����������');
    
                            // �������������� ���������� ��������� ��� ������ �����������
            // saveDataToFirebase();
    
    showVerificationModal();
    } else {
        // ���� PIN-���� ���, ���������� ����� ������� ������
        console.log('?? PIN-��� �� ������, ���������� ����� ������� ������');
        showAccountSelection();
    }
};

// ���������� ������� ��� ��������������� ������ ����������� (��� �������)
window.forceShowVerification = () => {
    console.log('?? �������������� ����� �����������...');
    
    console.log('?? �������������� ����� �����������, ������������� ��� ����������...');
    
    // ������ �������� ���� ����������� ����� �������������� ������� �����������
    
    // 1. ������������� ������ ������
    recalculateBestWeek();
    
    // 2. ��������� ��� �����������
    updateProgressDisplay();
    updateBestWeekDisplay();
    updateRedeemControls();
    updateProgressWeekSection();
    updateMonthlyProgressSection();
    updateWeeklyStars();
    
    // 3. ���������, ��� ��� ���������� ���������
    console.log('? �������������� ����� �����������, ��� ���������� �����������');
    
    showVerificationAfterSync();
};

// ���������� ������� ��� ���������� ������� ��������
window.toggleSettingsBlock = toggleSettingsBlock;
window.restoreSettingsBlocksState = restoreSettingsBlocksState;

// ���������� ������� ��� �����������
window.showVerificationAfterSync = showVerificationAfterSync;

// ===== NOTIFICATION SYSTEM =====

// Notification queue management
let notificationQueue = [];
let isProcessingQueue = false;

// Create and show popup notification
function showPopupNotification(type, title, message, icon, onClose) {
    console.log('?? showPopupNotification called:', { type, title, message, icon });
    
    const notificationId = Date.now() + Math.random();
    const notification = {
        id: notificationId,
        type: type, // 'star' or 'achievement'
        title: title,
        message: message,
        icon: icon,
        onClose: onClose || (() => {}),
        element: null
    };

    console.log('?? Adding notification to queue:', notification);
    
    // Add to queue
    notificationQueue.push(notification);
    console.log('?? Queue length after adding:', notificationQueue.length);

    // Process queue if not already processing
    if (!isProcessingQueue) {
        console.log('?? Processing queue...');
        processNotificationQueue();
    } else {
        console.log('?? Queue already processing, waiting...');
    }

    return notificationId;
}

// Process notification queue
function processNotificationQueue() {
    console.log('?? processNotificationQueue called, queue length:', notificationQueue.length);
    
    if (notificationQueue.length === 0) {
        console.log('?? Queue is empty, stopping processing');
        isProcessingQueue = false;
        return;
    }

    isProcessingQueue = true;
    const notification = notificationQueue.shift();
    console.log('?? Processing notification:', notification);
    createNotificationElement(notification);
}

// Create notification DOM element
function createNotificationElement(notification) {
    console.log('?? createNotificationElement called for:', notification);
    
    // Create notification element directly in body (bypass container issues)
    const notificationEl = document.createElement('div');
    notificationEl.className = `popup-notification ${notification.type}-notification`;
    notificationEl.setAttribute('data-notification-id', notification.id);
    
    // Set all styles inline to ensure they work - centered modal style
    notificationEl.style.cssText = `
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) scale(0.8) !important;
        z-index: 10000 !important;
        background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%) !important;
        border: 3px solid #3b82f6 !important;
        border-radius: 20px !important;
        padding: 40px !important;
        box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.1) !important;
        pointer-events: auto !important;
        max-width: 600px !important;
        min-width: 500px !important;
        opacity: 0 !important;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `;

    // Create notification content
    notificationEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px;">
            <div style="font-size: 3rem;">${notification.icon}</div>
            <h3 style="margin: 0; font-size: 1.5rem; font-weight: 700; color: #1e40af;">${notification.title}</h3>
        </div>
        <div style="margin-bottom: 24px;">
            <p style="margin: 0; color: #374151; line-height: 1.6; white-space: pre-line; font-size: 1.1rem;">${notification.message}</p>
        </div>
        <div style="display: flex; justify-content: center;">
            <button onclick="closeNotification(${notification.id})" style="
                background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                color: white;
                border: none;
                border-radius: 12px;
                padding: 12px 24px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
            " onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 16px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 12px rgba(59, 130, 246, 0.3)'">
                �������!
            </button>
        </div>
    `;

    // Add to body directly (no backdrop)
    document.body.appendChild(notificationEl);
    notification.element = notificationEl;
    console.log('?? Notification element added to body:', notificationEl);

    // Show animation
    safeSetTimeout(() => {
        notificationEl.style.transform = 'translate(-50%, -50%) scale(1)';
        notificationEl.style.opacity = '1';
        console.log('?? Notification shown:', notification.id);
        
        // Auto-close after 5 seconds
        safeSetTimeout(() => {
            closeNotification(notification.id);
        }, 5000);
    }, 100);
}

// Close notification
function closeNotification(notificationId) {
    console.log('?? closeNotification called for ID:', notificationId);
    
    const notificationEl = document.querySelector(`[data-notification-id="${notificationId}"]`);
    if (!notificationEl) {
        console.warn(`?? ����������� � ID ${notificationId} �� �������`);
        return;
    }

    // Find notification object
    const notification = notificationQueue.find(n => n.id === notificationId) || 
                       { id: notificationId, onClose: () => {} };

    // Hide animation
    notificationEl.style.transform = 'translate(-50%, -50%) scale(0.8)';
    notificationEl.style.opacity = '0';

    // Remove from DOM after animation
    safeSetTimeout(() => {
        if (notificationEl.parentNode) {
            notificationEl.parentNode.removeChild(notificationEl);
        }
        
        // Call onClose callback
        if (notification.onClose) {
            notification.onClose();
        }

        // Process next notification in queue
        safeSetTimeout(() => {
            processNotificationQueue();
        }, 100);
    }, 400);
}

// Force close all notifications
function closeAllNotifications() {
    console.log('?? closeAllNotifications called');
    
    // Close all popup notifications
    const popupNotifications = document.querySelectorAll('.popup-notification');
    popupNotifications.forEach(el => {
        const id = el.getAttribute('data-notification-id');
        if (id) {
            closeNotification(parseInt(id));
        }
    });
    
    // Clear notification queue
    notificationQueue.length = 0;
    isProcessingQueue = false;
    
    // Hide simple notifications
    const simpleNotification = document.getElementById('notification');
    if (simpleNotification) {
        simpleNotification.classList.remove('show');
    }
    
    console.log('?? All notifications closed');
}

// Add keyboard listener for Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllNotifications();
    }
});

// Star notification function removed

// Achievement notification function removed

// Show task completion notification
function showTaskCompletionNotification(task, xpEarned) {
    showPopupNotification(
        'task',
        '? ������� ���������!',
        `${task.name}\n\n��������: ${xpEarned} XP`,
        task.icon,
        () => {
            console.log('? Task completion notification closed');
        }
    );
}

// Show reward notification
function showRewardNotification(rewardDescription, starsUsed) {
    showPopupNotification(
        'reward',
        '?? ������� ��������!',
        `${rewardDescription}\n\n���������: ${starsUsed} ?`,
        '??',
        () => {
            console.log('?? Reward notification closed');
        }
    );
}

// Global function to close notification
window.closeNotification = closeNotification;

// Test functions for star and achievement notifications removed



// Test task completion notification
window.testTaskNotification = function() {
    const testTask = {
        name: '�������� �������',
        icon: '??'
    };
    showTaskCompletionNotification(testTask, 50);
};

// Test reward notification
window.testRewardNotification = function() {
    showRewardNotification('�������� �������', 3);
};

// Debug function to check current state
window.debugNotificationState = function() {
    console.log('?? ������� ��������� ��� �����������:');
    console.log('?? Progress:', {
        level: appState.progress.level,
        totalXP: appState.progress.totalXP,
        weeklyXP: appState.progress.weeklyXP,
        weeklyStars: appState.progress.weeklyStars,
        starBank: appState.progress.starBank,
        lastCheckedLevel: appState.progress.lastCheckedLevel
    });
    console.log('? calculateWeeklyStars result:', calculateWeeklyStars(appState.progress.weeklyXP));
    console.log('?? checkForNewAchievements result:', appState.progress.level > (appState.progress.lastCheckedLevel || 0));
};

// Test function for weekly progress logic
window.testWeeklyProgress = function() {
    console.log('?? ������������ ������ ���������� ���������:');
    
    // Test current week
    const today = new Date();
    const currentWeekStart = getWeekStartForDate(today);
    const currentWeekXP = computeWeekXP(currentWeekStart);
    
    console.log('?? ������� ������:', {
        today: today.toISOString().split('T')[0],
        weekStart: currentWeekStart.toISOString().split('T')[0],
        weekXP: currentWeekXP,
        progressPercent: getWeeklyProgressPercent(currentWeekXP)
    });
    
    // Test different dates
    const testDates = [
        new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)  // 1 month ago
    ];
    
    testDates.forEach((date, index) => {
        const weekStart = getWeekStartForDate(date);
        const weekXP = computeWeekXP(weekStart);
        console.log(`?? ������ ${index + 1} �����:`, {
            date: date.toISOString().split('T')[0],
            weekStart: weekStart.toISOString().split('T')[0],
            weekXP: weekXP,
            progressPercent: getWeeklyProgressPercent(weekXP)
        });
    });
    
    // Test progress view offset
    const currentOffset = appState.progressView?.weekOffset || 0;
    const viewWeekStart = getWeekStartFromOffset(currentOffset);
    const viewWeekXP = computeWeekXP(viewWeekStart);
    
    console.log('??? ������� �������� ������:', {
        offset: currentOffset,
        weekStart: viewWeekStart.toISOString().split('T')[0],
        weekXP: viewWeekXP,
        progressPercent: getWeeklyProgressPercent(viewWeekXP)
    });
};

// Test function for modal progress preview
window.testModalProgress = function() {
    console.log('?? ������������ ���������������� ��������� � ��������� ����:');
    
    // Create a test task
    const testTask = {
        id: 999999,
        name: '�������� �������',
        description: '��� �������� ���������������� ���������',
        xpReward: 100,
        duration: 30,
        icon: '??'
    };
    
    // Show modal
    showTaskCompletionModal(testTask);
    
    console.log('?? ��������� ���� ������� � �������� �������� (100 XP)');
    console.log('?? ��������� � ��������� ����:');
    console.log('   - ������� ��������� ������ ���������� ������� XP + 100');
    console.log('   - ��� ��������� XP � ���� ����� ������� ������ �����������');
    console.log('   - ��� ��������� ���� ������� ������ ��������������� ��� ����� ������');
};

// Force trigger functions for star and achievement notifications removed

// Force gain a star for testing
window.forceGainStar = function() {
    console.log('?? ������������� �������� ������ ��� ������������');
    const oldWeeklyXP = appState.progress.weeklyXP;
    const oldWeeklyStars = appState.progress.weeklyStars;
    
    // Add enough XP to get next star
    if (oldWeeklyStars === 0) {
        appState.progress.weeklyXP = 500; // First star
    } else if (oldWeeklyStars === 1) {
        appState.progress.weeklyXP = 750; // Second star
    } else {
        appState.progress.weeklyXP = oldWeeklyXP + 250; // Add more XP
    }
    
    console.log('?? �������� weeklyXP �', oldWeeklyXP, '��', appState.progress.weeklyXP);
    updateWeeklyStars();
};

// Test notification directly
window.testNotification = function() {
    console.log('?? ��������� ����������� ��������');
    showPopupNotification('star', '? ���� �����������!', '��� �������� ����������� ��� �������� ���������', '?', () => {
        console.log('? �������� ����������� �������');
    });
};

// ==================== ������� ������� ====================

// ���������� ������ ��� ������
function prepareBackupData(type = 'manual', reason = '') {
    const backupData = {
        // �������� ������ ����������
        progress: appState.progress,
        tasks: appState.tasks,
        rewards: appState.rewards,
        activityData: appState.activityData,
        rewardPlan: appState.rewardPlan,
        resetDate: appState.resetDate,
        
        // ���������� � ������������
        user: appState.user,
        userName: appState.userName,
        role: appState.role,
        isVerified: appState.isVerified,
        pinCodes: appState.pinCodes,
        
        // ��������� ����������
        currentMonth: appState.currentMonth,
        selectedDate: appState.selectedDate,
        progressView: appState.progressView,
        
        // ��������� �������
        backupSettings: appState.backupSettings,
        
        // ���������� ������
        backupInfo: {
            type: type,
            reason: reason,
            timestamp: new Date().toISOString(),
            version: '1.1',
            exportedBy: appState.userName,
            exportRole: appState.role,
            totalTasks: appState.tasks.length,
            totalRewards: appState.rewards.length,
            totalActivityDays: Object.keys(appState.activityData).length,
            currentLevel: appState.progress.level,
            totalXP: appState.progress.totalXP,
            starBank: appState.progress.starBank,
            checksum: calculateChecksum(appState)
        }
    };
    
    return backupData;
}

// ��������� ID ������
function generateBackupId(type, timestamp = null) {
    const ts = timestamp || new Date();
    const dateStr = ts.toISOString().split('T')[0];
    const timeStr = ts.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
    return `backup-${type}-${dateStr}-${timeStr}`;
}

// ������ ����������� �����
function calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

// ���������� ������ � Firebase
async function saveBackupToFirebase(backupId, backupData) {
    if (!isFirebaseAvailable()) {
        throw new Error('Firebase ����������');
    }

    try {
        const backupRef = doc(db, 'backups', backupId);
        await setDoc(backupRef, backupData);
        
        console.log('? ����� �������� � Firebase:', backupId);
        return true;
    } catch (error) {
        console.error('? ������ ���������� ������:', error);
        throw error;
    }
}

// �������� ������� ������
async function createManualBackup() {
    if (appState.role === 'viewer' || appState.userName === '������') {
        showNotification('������ � ���������� �������� ���������', 'warning');
        return;
    }

    try {
        showNotification('�������� ������...', 'info');
        
        const backupData = prepareBackupData('manual', '������ ��������');
        const backupId = generateBackupId('manual');
        
        await saveBackupToFirebase(backupId, backupData);
        
        // ��������� ���������
        appState.backupSettings.lastBackup = new Date().toISOString();
        updateNextBackupTime();
        
        // ��������� ����������� ���������
        try {
            localStorage.setItem('englishLearningData', JSON.stringify(appState));
            if (isFirebaseAvailable()) {
                await saveDataToFirebase();
            }
        } catch (error) {
            console.error('? ������ ���������� �������� ����� �������� ������:', error);
        }
        
        showNotification('����� ������ �������!', 'success');
        toggleSettingsMenu();
    } catch (error) {
        showNotification('������ �������� ������: ' + error.message, 'error');
    }
}

// �������� ��������������� ������
async function createScheduledBackup() {
    if (!appState.backupSettings.autoBackup) {
        return;
    }

    try {
        console.log('?? �������� ��������������� ������...');
        
        const backupData = prepareBackupData('scheduled', '�������������� �����');
        const backupId = generateBackupId('scheduled');
        
        await saveBackupToFirebase(backupId, backupData);
        
        // ��������� ���������
        appState.backupSettings.lastBackup = new Date().toISOString();
        updateNextBackupTime();
        
        // ��������� ����������� ���������
        try {
            localStorage.setItem('englishLearningData', JSON.stringify(appState));
            if (isFirebaseAvailable()) {
                await saveDataToFirebase();
            }
        } catch (error) {
            console.error('? ������ ���������� �������� ����� ��������������� ������:', error);
        }
        
        console.log('? �������������� ����� ������:', backupId);
        
        // ������� ������ ������
        await cleanupOldBackups();
    } catch (error) {
        console.error('? ������ �������� ��������������� ������:', error);
    }
}

// ���������� ������� ���������� ������
function updateNextBackupTime() {
    if (!appState.backupSettings.autoBackup) return;
    
    const now = new Date();
    const frequency = appState.backupSettings.backupFrequency;
    
    let nextBackup = new Date(now);
    
    switch (frequency) {
        case 'daily':
            nextBackup.setDate(now.getDate() + 1);
            nextBackup.setHours(2, 0, 0, 0); // 2:00 ����
            break;
        case 'weekly':
            nextBackup.setDate(now.getDate() + 7);
            nextBackup.setHours(2, 0, 0, 0);
            break;
        case 'monthly':
            nextBackup.setMonth(now.getMonth() + 1);
            nextBackup.setHours(2, 0, 0, 0);
            break;
    }
    
    appState.backupSettings.nextBackup = nextBackup.toISOString();
    console.log('?? ��������� ����� ������������ ��:', nextBackup.toLocaleString());
}

// �������� ������������� �������� ������
function shouldCreateScheduledBackup() {
    if (!appState.backupSettings.autoBackup) return false;
    if (!appState.backupSettings.nextBackup) return true;
    
    const now = new Date();
    const nextBackup = new Date(appState.backupSettings.nextBackup);
    
    return now >= nextBackup;
}

// ������� ������ �������
async function cleanupOldBackups() {
    if (!isFirebaseAvailable()) return;
    
    try {
        const backupsRef = collection(db, 'backups');
        const snapshot = await getDocs(backupsRef);
        
        const backups = [];
        snapshot.forEach(doc => {
            backups.push({
                id: doc.id,
                timestamp: doc.data().backupInfo?.timestamp || doc.id
            });
        });
        
        // ��������� �� ������� (����� �������)
        backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // ������� ������ ������
        const maxBackups = appState.backupSettings.maxBackups;
        if (backups.length > maxBackups) {
            const toDelete = backups.slice(maxBackups);
            
            for (const backup of toDelete) {
                await deleteDoc(doc(db, 'backups', backup.id));
                console.log('??? ������ ������ �����:', backup.id);
            }
        }
    } catch (error) {
        console.error('? ������ ������� ������ �������:', error);
    }
}

// ������ �������� �������������� �������
function startBackupScheduler() {
    // ��������� ������ 30 �����
    setInterval(async () => {
        if (shouldCreateScheduledBackup()) {
            await createScheduledBackup();
        }
    }, 30 * 60 * 1000);
    
    console.log('? ����������� ������� �������');
}

// ������������� ������� �������
function initializeBackupSystem() {
    // ����������, ��� ��������� ������� ����������������
    if (!appState.backupSettings) {
        appState.backupSettings = {
            autoBackup: true,
            backupFrequency: 'daily',
            maxBackups: 7,
            lastBackup: null,
            nextBackup: null,
            backupTypes: {
                scheduled: true,
                manual: true
            }
        };
    }
    
    // ������������� ����� ���������� ������ ���� ��� ���
    if (!appState.backupSettings.nextBackup) {
        updateNextBackupTime();
    }
    
    // ��������� �����������
    startBackupScheduler();
    
    console.log('?? ������� ������� ����������������');
    console.log('?? ������� ��������� �������:', appState.backupSettings);
}

// ��������� ������� ������� ����� ��������
safeSetTimeout(initializeBackupSystem, 2000);

// ==================== ������������ ������� ������� ====================

// ���� ���������� �������� �������
window.testBackupSettings = function() {
    console.log('?? ��������� ������� �������� �������...');
    
    // ��������� ������� ���������
    console.log('?? ������� ��������� �������:', appState.backupSettings);
    
    // �������� ���������
    const originalSettings = { ...appState.backupSettings };
    appState.backupSettings.autoBackup = false;
    appState.backupSettings.backupFrequency = 'weekly';
    appState.backupSettings.maxBackups = 10;
    
    console.log('?? ���������� ���������:', appState.backupSettings);
    
    // ��������� � localStorage
    try {
        localStorage.setItem('englishLearningData', JSON.stringify(appState));
        console.log('? ��������� ��������� � localStorage');
    } catch (error) {
        console.error('? ������ ���������� � localStorage:', error);
    }
    
    // ��������� �������
    try {
        const loadedData = JSON.parse(localStorage.getItem('englishLearningData'));
        console.log('?? ����������� ��������� �������:', loadedData.backupSettings);
        
        if (loadedData.backupSettings.autoBackup === false && 
            loadedData.backupSettings.backupFrequency === 'weekly' && 
            loadedData.backupSettings.maxBackups === 10) {
            console.log('? ���� localStorage ������ �������!');
        } else {
            console.error('? ���� localStorage �� ������!');
        }
    } catch (error) {
        console.error('? ������ �������� �� localStorage:', error);
    }
    
    // ��������������� ������������ ���������
    appState.backupSettings = originalSettings;
    localStorage.setItem('englishLearningData', JSON.stringify(appState));
    console.log('?? ������������ ��������� �������������');
};

// ���� ������������ �������
window.testBackupScheduler = function() {
    console.log('?? ��������� ����������� �������...');
    
    const now = new Date();
    console.log('?? ������� �����:', now.toLocaleString());
    console.log('?? ��������� �����:', appState.backupSettings.nextBackup ? new Date(appState.backupSettings.nextBackup).toLocaleString() : '�� ����������');
    console.log('? ����� �� ����� ������:', shouldCreateScheduledBackup());
    
    // ��������� ������ �������
    const frequencies = ['daily', 'weekly', 'monthly'];
    frequencies.forEach(freq => {
        const testSettings = { ...appState.backupSettings, backupFrequency: freq };
        const nextTime = calculateNextBackupTime(testSettings);
        console.log(`?? ${freq}: ��������� ����� ����� ${nextTime.toLocaleString()}`);
    });
};

// ��������������� ������� ��� ������� ������� ���������� ������
function calculateNextBackupTime(settings) {
    const now = new Date();
    let nextBackup = new Date(now);
    
    switch (settings.backupFrequency) {
        case 'daily':
            nextBackup.setDate(now.getDate() + 1);
            nextBackup.setHours(2, 0, 0, 0);
            break;
        case 'weekly':
            nextBackup.setDate(now.getDate() + 7);
            nextBackup.setHours(2, 0, 0, 0);
            break;
        case 'monthly':
            nextBackup.setMonth(now.getMonth() + 1);
            nextBackup.setHours(2, 0, 0, 0);
            break;
    }
    
    return nextBackup;
}

// ==================== UI ���������� �������� ====================

// �������� �������� �������
async function showBackupManager() {
    if (appState.role === 'viewer' || appState.userName === '������') {
        showNotification('������ � ���������� �������� ���������', 'warning');
        return;
    }

    try {
        showNotification('�������� ������ �������...', 'info');
        
        const backups = await listAllBackups();
        
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content backup-manager-modal">
                <div class="modal-header">
                    <h3>?? �������� �������</h3>
                </div>
                <div class="modal-body">
                    <div class="backup-stats">
                        <div class="stat-item">
                            <span class="stat-label">����� �������:</span>
                            <span class="stat-value">${backups.length}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">��������� �����:</span>
                            <span class="stat-value">${appState.backupSettings.lastBackup ? new Date(appState.backupSettings.lastBackup).toLocaleString() : '�������'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">��������� �����:</span>
                            <span class="stat-value">${appState.backupSettings.nextBackup ? new Date(appState.backupSettings.nextBackup).toLocaleString() : '�� ������������'}</span>
                        </div>
                    </div>
                    <div class="backup-list">
                        <h4>������ �������:</h4>
                        <div class="backup-items">
                            ${backups.map(backup => `
                                <div class="backup-item">
                                    <div class="backup-info">
                                        <div class="backup-type">${getBackupTypeIcon(backup.type)} ${backup.type}</div>
                                        <div class="backup-date">${new Date(backup.timestamp).toLocaleString()}</div>
                                        <div class="backup-details">
                                            �������: ${backup.level} | XP: ${backup.totalXP} | �������: ${backup.totalTasks}
                                        </div>
                                    </div>
                                    <div class="backup-actions">
                                        <button class="btn btn-sm btn-primary" onclick="restoreFromSpecificBackup('${backup.id}')">
                                            ������������
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="deleteBackup('${backup.id}')">
                                            �������
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer centered">
                    <button class="btn btn-primary" onclick="createManualBackup(); this.closest('.modal').remove();">
                        ������� ����� �����
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        �������
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    } catch (error) {
        showNotification('������ �������� �������: ' + error.message, 'error');
    }
}

// �������� ������ ���� �������
async function listAllBackups() {
    if (!isFirebaseAvailable()) {
        throw new Error('Firebase ����������');
    }

    const backupsRef = collection(db, 'backups');
    const snapshot = await getDocs(backupsRef);
    
    const backups = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        const backupInfo = data.backupInfo || {};
        
        backups.push({
            id: doc.id,
            type: backupInfo.type || 'unknown',
            timestamp: backupInfo.timestamp || doc.id,
            level: backupInfo.currentLevel || 0,
            totalXP: backupInfo.totalXP || 0,
            totalTasks: backupInfo.totalTasks || 0,
            exportedBy: backupInfo.exportedBy || 'Unknown'
        });
    });
    
    // ��������� �� ������� (����� �������)
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return backups;
}

// �������� ������ ���� ������
function getBackupTypeIcon(type) {
    switch (type) {
        case 'manual': return '??';
        case 'scheduled': return '?';
        default: return '??';
    }
}

// �������� ��������� �������
function showBackupSettings() {
    if (appState.role === 'viewer' || appState.userName === '������') {
        showNotification('������ � ���������� ������� ���������', 'warning');
        return;
    }

    console.log('?? ������� ��������� �������:', appState.backupSettings);

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>?? ��������� �������</h3>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="autoBackupEnabled" ${appState.backupSettings.autoBackup ? 'checked' : ''}>
                        �������������� ������
                    </label>
                </div>
                <div class="form-group">
                    <label class="form-label">������� �������:</label>
                    <select id="backupFrequency" class="form-input">
                        <option value="daily" ${appState.backupSettings.backupFrequency === 'daily' ? 'selected' : ''}>���������</option>
                        <option value="weekly" ${appState.backupSettings.backupFrequency === 'weekly' ? 'selected' : ''}>�����������</option>
                        <option value="monthly" ${appState.backupSettings.backupFrequency === 'monthly' ? 'selected' : ''}>����������</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">�������� �������:</label>
                    <input type="number" id="maxBackups" class="form-input" value="${appState.backupSettings.maxBackups || 7}" min="1" max="30">
                </div>
                <div class="backup-info">
                    <h4>���������� � �������:</h4>
                    <p><strong>��������� �����:</strong> ${appState.backupSettings.lastBackup ? new Date(appState.backupSettings.lastBackup).toLocaleString() : '�������'}</p>
                    <p><strong>��������� �����:</strong> ${appState.backupSettings.nextBackup ? new Date(appState.backupSettings.nextBackup).toLocaleString() : '�� ������������'}</p>
                    <p><strong>������� �������:</strong> ${getFrequencyText(appState.backupSettings.backupFrequency)}</p>
                    <p><strong>�������������� ������:</strong> ${appState.backupSettings.autoBackup ? '��������' : '���������'}</p>
                </div>
            </div>
            <div class="modal-footer centered">
                <button class="btn btn-primary" onclick="saveBackupSettings(); this.closest('.modal').remove();">
                    ���������
                </button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                    ������
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// �������� ����� ������� �������
function getFrequencyText(frequency) {
    switch (frequency) {
        case 'daily': return '���������';
        case 'weekly': return '�����������';
        case 'monthly': return '����������';
        default: return '�� �����������';
    }
}

// ��������� ��������� �������
async function saveBackupSettings() {
    const autoBackup = document.getElementById('autoBackupEnabled').checked;
    const frequency = document.getElementById('backupFrequency').value;
    const maxBackups = parseInt(document.getElementById('maxBackups').value);
    
    console.log('?? ��������� ��������� �������:', { autoBackup, frequency, maxBackups });
    
    // ��������� ��������� � appState
    appState.backupSettings.autoBackup = autoBackup;
    appState.backupSettings.backupFrequency = frequency;
    appState.backupSettings.maxBackups = maxBackups;
    
    // ��������� ����� ���������� ������
    updateNextBackupTime();
    
    console.log('?? ����������� ��������� �������:', appState.backupSettings);
    
    // ��������� � localStorage
    try {
        localStorage.setItem('englishLearningData', JSON.stringify(appState));
        console.log('? ��������� ������� ��������� � localStorage');
    } catch (error) {
        console.error('? ������ ���������� � localStorage:', error);
        showNotification('������ ���������� � localStorage', 'error');
        return;
    }
    
    // �������������� � Firebase
    try {
        if (isFirebaseAvailable()) {
            await saveDataToFirebase();
            console.log('? ��������� ������� ���������������� � Firebase');
        }
    } catch (error) {
        console.error('? ������ ������������� � Firebase:', error);
        showNotification('��������� ��������� ��������, �� �� ���������������� � Firebase', 'warning');
        return;
    }
    
    showNotification('��������� ������� ���������!', 'success');
}

// ������������ �� ������ (�����)
async function restoreFromBackup() {
    if (appState.role === 'viewer' || appState.userName === '������') {
        showNotification('������ � �������������� �� ������� ���������', 'warning');
        return;
    }

    try {
        const backups = await listAllBackups();
        
        if (backups.length === 0) {
            showNotification('������ �� �������', 'warning');
            return;
        }
        
        // ���������� ������ ������� ��� ������
        showBackupManager();
    } catch (error) {
        showNotification('������ �������� �������: ' + error.message, 'error');
    }
}

// ������������ �� ����������� ������
async function restoreFromSpecificBackup(backupId) {
    if (appState.role === 'viewer' || appState.userName === '������') {
        showNotification('������ � �������������� �� ������� ���������', 'warning');
        return;
    }

    if (!confirm('�� �������, ��� ������ ������������ ������ �� ����� ������? ������� ������ ����� ��������.')) {
        return;
    }

    try {
        showNotification('�������������� �� ������...', 'info');
        
        const backupRef = doc(db, 'backups', backupId);
        const backupDoc = await getDoc(backupRef);
        
        if (!backupDoc.exists()) {
            throw new Error('����� �� ������');
        }
        
        const backupData = backupDoc.data();
        
        // �����: ��������������� ���� ������ �� ������
        console.log('?? ��������������� ���� ������ �� ������...');
        const restoredData = restoreDataTypes(backupData);
        
        // ��������������� ������ � ����������� ������
        appState.progress = restoredData.progress || backupData.progress;
        appState.tasks = restoredData.tasks || backupData.tasks;
        appState.rewards = restoredData.rewards || backupData.rewards;
        appState.activityData = restoredData.activityData || backupData.activityData;
        appState.rewardPlan = restoredData.rewardPlan || backupData.rewardPlan;
        appState.resetDate = restoredData.resetDate || backupData.resetDate;
        appState.user = restoredData.user || backupData.user;
        appState.userName = restoredData.userName || backupData.userName;
        appState.role = restoredData.role || backupData.role;
        appState.isVerified = restoredData.isVerified || backupData.isVerified;
        appState.pinCodes = restoredData.pinCodes || backupData.pinCodes;
        appState.currentMonth = restoredData.currentMonth || backupData.currentMonth;
        appState.selectedDate = restoredData.selectedDate || backupData.selectedDate;
        appState.progressView = restoredData.progressView || backupData.progressView;
        
        // �����: ���������� ���� ������������� ��� ���������� ����������
        appState.isInitializing = false;
        console.log('?? ���� ������������� ������� ����� �������������� �� ������');
        
        // �����: ������� ��� DOM ��������� ��� ����������� ����������
        Object.keys(DOM_CACHE).forEach(key => {
            DOM_CACHE[key] = null;
        });
        console.log('?? ��� DOM ��������� ������ ����� �������������� �� ������');
        
        // ��������� UI
        updateProgressDisplay();
        renderTasks();
        renderRewards();
        generateCalendar();
        updateDayActivity();
        renderWeeklyChart();
        updateBestWeekDisplay();
        updateRedeemControls();
        updateProgressWeekSection();
        updateMonthlyProgressSection();
        updateWeeklyStars();
        updateAchievementsBank();
        updateLearningTimeDisplay();
        
        // �����: ��������� ��������������� ������ �������� � � Firebase
        console.log('?? ��������� ��������������� ������ ��������...');
        const localSaveResult = saveState();
        
        console.log('?? ��������� ��������������� ������ � Firebase...');
        const firebaseSaveResult = await saveDataToFirebaseSilent();
        
        if (localSaveResult && firebaseSaveResult) {
            console.log('? ��������������� ������ ������� ��������� �������� � � Firebase');
            showNotification('������ ������������� �� ������ � ���������!', 'success');
        } else if (localSaveResult) {
            console.log('? ��������������� ������ ��������� ��������, Firebase ����������');
            showNotification('������ ������������� �� ������ � ��������� ��������', 'success');
        } else if (firebaseSaveResult) {
            console.log('? ��������������� ������ ��������� � Firebase, localStorage ����������');
            showNotification('������ ������������� �� ������ � ��������� � Firebase', 'success');
        } else {
            console.warn('?? �� ������� ��������� ��������������� ������');
            showNotification('������ ������������� �� ������, �� �� ���������', 'warning');
        }
        
        // ��������� ��������� ���� ���������
        const modal = document.querySelector('.backup-manager-modal');
        if (modal) {
            modal.closest('.modal').remove();
        }
    } catch (error) {
        showNotification('������ ��������������: ' + error.message, 'error');
    }
}

// ������� �����
async function deleteBackup(backupId) {
    if (appState.role === 'viewer' || appState.userName === '������') {
        showNotification('������ � �������� ������� ���������', 'warning');
        return;
    }

    if (!confirm('�� �������, ��� ������ ������� ���� �����?')) {
        return;
    }

    try {
        await deleteDoc(doc(db, 'backups', backupId));
        showNotification('����� ������!', 'success');
        
        // ��������� ������ �������
        const modal = document.querySelector('.backup-manager-modal');
        if (modal) {
            modal.closest('.modal').remove();
            showBackupManager();
        }
    } catch (error) {
        showNotification('������ �������� ������: ' + error.message, 'error');
    }
}

// ������� ������ �� ���������� (����������)
async function exitApp() {
    console.log('?? ����� �� ����������...');
    console.log('exitApp function called successfully!');
    
    // ���������, ��� ������� �������� ���������
    if (typeof window !== 'undefined') {
        window.exitApp = exitApp;
        console.log('exitApp function registered globally');
    }
    
    // ���������� ����������� � ����������
    showNotification('���������� ������ ����� �������...', 'info');
    
    try {
        // ��������� ������ � Firebase
        const saveResult = await saveDataToFirebase();
        
        if (saveResult) {
showNotification('������ ���������. ����� �� ����������...', 'success');

// ���� �������, ����� ������������ ������ �����������
setTimeout(() => {
    // ��������� ����������
    if (window.close) {
        window.close();
    } else {
        // ���� window.close �� ��������, ���������� ���������
        alert('���������� ������ � ��������. �������� ������� �������.');
    }
}, 1500);
        } else {
showNotification('������ ����������. ����� �������.', 'error');
        }
    } catch (error) {
        console.error('������ ��� ������:', error);
        showNotification('������ ����������. ����� �������.', 'error');
    }
}

// ������������ ������� ���������
if (typeof window !== 'undefined') {
    window.exitApp = exitApp;
    console.log('exitApp function registered globally at end of file');
}

// ���������� ���������� ��� �������� ��������
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOM �����, ��������� ����������');
        if (typeof initApp === 'function') {
initApp();
        } else {
console.error('initApp function �� �������!');
        }
    });
} else {
    console.log('DOM ��� �����, ��������� ����������');
    if (typeof initApp === 'function') {
        initApp();
    } else {
        console.error('initApp function �� �������!');
    }
}
        
        
