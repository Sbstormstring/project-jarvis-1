// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const customUrlInput = document.getElementById('customUrl');
const searchInput = document.getElementById('searchInput');
const infoDisplay = document.getElementById('infoDisplay');

// State
let todos = [];
let currentFilter = 'all';
const STORAGE_KEY = 'todos';
let currentTemp = 72;
let deviceStates = {
    lights: 'off',
    music: 'pause',
    tv: 'off'
};

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isListening = true;
        voiceBtn.classList.add('listening');
        voiceBtn.querySelector('.voice-text').textContent = 'Listening...';
        voiceStatus.textContent = '🎤 Listening for voice commands...';
        voiceStatus.style.color = '#667eea';
    };

    recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }
        
        if (event.isFinal) {
            handleVoiceCommand(transcript.toLowerCase());
        }
    };

    recognition.onerror = (event) => {
        voiceStatus.textContent = '❌ ' + event.error;
        voiceStatus.style.color = '#ff6b6b';
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        isListening = false;
        voiceBtn.classList.remove('listening');
        voiceBtn.querySelector('.voice-text').textContent = 'Click to Speak';
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTodos();
    renderTodos();
    updateStats();
    
    if (!recognition) {
        voiceBtn.disabled = true;
        voiceStatus.textContent = '⚠️ Speech recognition not supported in your browser';
        voiceStatus.style.color = '#ffa500';
    }
});

// Tab Functionality
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
    });
});

// Event Listeners
addBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTodo();
    }
});

voiceBtn.addEventListener('click', () => {
    if (recognition) {
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }
});

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentFilter = e.target.dataset.filter;
        renderTodos();
    });
});

clearCompletedBtn.addEventListener('click', clearCompleted);
clearAllBtn.addEventListener('click', clearAll);

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// ==================== VOICE COMMANDS ====================

function handleVoiceCommand(command) {
    voiceStatus.textContent = `📝 Command: "${command}"`;
    voiceStatus.style.color = '#667eea';
    
    // Task Commands
    if (command.startsWith('add ')) {
        const taskName = command.substring(4).trim();
        if (taskName) {
            todoInput.value = taskName;
            addTodo();
            speak(`Task "${taskName}" added successfully`);
        }
    }
    else if (command.includes('list') || command.includes('show all') || command.includes('show tasks')) {
        filterBtns[0].click();
        listTasksAloud();
    }
    else if (command.includes('list active') || command.includes('show active')) {
        filterBtns[1].click();
        listTasksAloud();
    }
    else if (command.includes('list completed') || command.includes('show completed')) {
        filterBtns[2].click();
        listTasksAloud();
    }
    else if (command.startsWith('complete ') || command.startsWith('mark ')) {
        const match = command.match(/\d+/);
        if (match) {
            const index = parseInt(match[0]) - 1;
            if (index >= 0 && index < todos.length) {
                toggleTodo(todos[index].id);
                speak(`Task "${todos[index].text}" marked as complete`);
            }
        }
    }
    else if (command.startsWith('delete ') || command.startsWith('remove ')) {
        const match = command.match(/\d+/);
        if (match) {
            const index = parseInt(match[0]) - 1;
            if (index >= 0 && index < todos.length) {
                const taskName = todos[index].text;
                deleteTodo(todos[index].id);
                speak(`Task "${taskName}" deleted`);
            }
        }
    }
    else if (command.includes('how many') || command.includes('count')) {
        const total = todos.length;
        const active = todos.filter(t => !t.completed).length;
        speak(`You have ${total} total tasks. ${active} are still active.`);
    }
    else if (command.includes('clear completed')) {
        if (todos.some(t => t.completed)) {
            clearCompleted();
            speak('Completed tasks cleared');
        } else {
            speak('No completed tasks to clear');
        }
    }
    // Website Commands
    else if (command.startsWith('open ') || command.startsWith('go to ') || command.startsWith('visit ')) {
        let websiteName = command.replace(/^(open|go to|visit) /, '').trim();
        openWebsiteByVoice(websiteName);
    }
    // Smart Home Commands
    else if (command.includes('turn on') || command.includes('turn on the lights')) {
        controlDevice('lights', 'on');
        speak('Turning on the lights');
    }
    else if (command.includes('turn off') || command.includes('turn off the lights')) {
        controlDevice('lights', 'off');
        speak('Turning off the lights');
    }
    else if (command.includes('dim') || command.includes('dim the lights')) {
        controlDevice('lights', 'dim');
        speak('Dimming the lights');
    }
    else if (command.includes('brighten') || command.includes('brighten the lights')) {
        controlDevice('lights', 'bright');
        speak('Brightening the lights');
    }
    else if (command.includes('play music') || command.includes('play the music')) {
        controlDevice('music', 'play');
        speak('Playing music');
    }
    else if (command.includes('pause music') || command.includes('pause')) {
        controlDevice('music', 'pause');
        speak('Pausing music');
    }
    else if (command.includes('next song') || command.includes('next track')) {
        controlDevice('music', 'next');
        speak('Playing next song');
    }
    else if (command.includes('previous song') || command.includes('previous track')) {
        controlDevice('music', 'previous');
        speak('Playing previous song');
    }
    else if (command.includes('set temperature') || command.includes('set temp')) {
        const match = command.match(/\d+/);
        if (match) {
            currentTemp = parseInt(match[0]);
            document.getElementById('tempDisplay').textContent = currentTemp + '°F';
            speak(`Temperature set to ${currentTemp} degrees`);
        }
    }
    else if (command.includes('turn on tv') || command.includes('turn on the tv')) {
        controlDevice('tv', 'on');
        speak('Turning on the TV');
    }
    else if (command.includes('turn off tv') || command.includes('turn off the tv')) {
        controlDevice('tv', 'off');
        speak('Turning off the TV');
    }
    // Info Commands
    else if (command.includes('weather') || command.includes('what\'s the weather')) {
        getWeather();
    }
    else if (command.includes('what time') || command.includes('current time')) {
        getTimeVoice();
    }
    else if (command.includes('what date') || command.includes('today\'s date')) {
        getDateVoice();
    }
    else if (command.startsWith('search ') || command.startsWith('tell me about ')) {
        const searchTerm = command.replace(/^(search|tell me about) /, '').trim();
        performWebSearch(searchTerm);
    }
    else if (command.includes('help') || command.includes('commands')) {
        const commands = [
            'Task commands: Add task, list tasks, complete task number, delete task number',
            'Website commands: Open Google, visit GitHub, go to YouTube',
            'Smart home commands: Turn on lights, play music, set temperature to 72',
            'Info commands: What\'s the weather, what time is it, search for something'
        ];
        speak(commands.join('. '));
    }
    else {
        voiceStatus.textContent = '❓ Command not recognized. Say "help" for available commands.';
        voiceStatus.style.color = '#ffa500';
        speak('Command not recognized. Say help for available commands');
    }
}

function listTasksAloud() {
    if (todos.length === 0) {
        speak('You have no tasks');
        return;
    }
    let message = `You have ${todos.length} tasks. `;
    todos.forEach((task, index) => {
        const status = task.completed ? 'complete' : 'active';
        message += `Task ${index + 1}: ${task.text}, ${status}. `;
    });
    speak(message);
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    speechSynthesis.speak(utterance);
}

// ==================== TASK FUNCTIONS ====================

function addTodo() {
    const text = todoInput.value.trim();
    
    if (text === '') {
        alert('Please enter a task!');
        return;
    }

    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleDateString()
    };

    todos.push(todo);
    saveTodos();
    renderTodos();
    updateStats();
    todoInput.value = '';
    todoInput.focus();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
}

function toggleTodo(id) {
    todos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos();
    renderTodos();
    updateStats();
}

function renderTodos() {
    todoList.innerHTML = '';

    const filteredTodos = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });

    if (filteredTodos.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    filteredTodos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-index', index + 1);
        li.innerHTML = `
            <div class="todo-checkbox" onclick="toggleTodo(${todo.id})"></div>
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <span class="todo-date">${todo.createdAt}</span>
            <button class="delete-btn" onclick="deleteTodo(${todo.id})">Delete</button>
        `;
        todoList.appendChild(li);
    });
}

function updateStats() {
    const total = todos.length;
    const active = todos.filter(todo => !todo.completed).length;
    const completed = todos.filter(todo => todo.completed).length;

    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;
}

function clearCompleted() {
    if (todos.some(todo => todo.completed)) {
        if (confirm('Clear all completed tasks?')) {
            todos = todos.filter(todo => !todo.completed);
            saveTodos();
            renderTodos();
            updateStats();
        }
    } else {
        alert('No completed tasks to clear!');
    }
}

function clearAll() {
    if (todos.length === 0) {
        alert('No tasks to clear!');
        return;
    }
    if (confirm('Delete all tasks? This cannot be undone!')) {
        todos = [];
        saveTodos();
        renderTodos();
        updateStats();
    }
}

function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
    const stored = localStorage.getItem(STORAGE_KEY);
    todos = stored ? JSON.parse(stored) : [];
}

// ==================== WEBSITE FUNCTIONS ====================

function openWebsite(url, name) {
    window.open(url, '_blank');
    speak(`Opening ${name}`);
}

function openCustomWebsite() {
    let input = customUrlInput.value.trim();
    if (!input) {
        alert('Please enter a website URL or name');
        return;
    }
    
    // Add https if not present
    if (!input.startsWith('http')) {
        input = 'https://' + input;
    }
    
    window.open(input, '_blank');
    speak(`Opening ${customUrlInput.value}`);
    customUrlInput.value = '';
}

function openWebsiteByVoice(websiteName) {
    const websites = {
        'google': 'https://www.google.com',
        'github': 'https://www.github.com',
        'youtube': 'https://www.youtube.com',
        'spotify': 'https://www.spotify.com',
        'netflix': 'https://www.netflix.com',
        'twitter': 'https://www.twitter.com',
        'facebook': 'https://www.facebook.com',
        'reddit': 'https://www.reddit.com',
        'amazon': 'https://www.amazon.com'
    };
    
    const url = websites[websiteName.toLowerCase()];
    if (url) {
        window.open(url, '_blank');
        speak(`Opening ${websiteName}`);
    } else {
        // Try to open as URL
        window.open('https://' + websiteName, '_blank');
        speak(`Opening ${websiteName}`);
    }
}

// ==================== SMART HOME FUNCTIONS ====================

function controlDevice(device, action) {
    const statusDisplay = document.getElementById('voiceStatus');
    
    if (device === 'lights') {
        deviceStates.lights = action;
        statusDisplay.textContent = `💡 Lights ${action}`;
    } else if (device === 'music') {
        deviceStates.music = action;
        statusDisplay.textContent = `🎵 Music ${action}`;
    } else if (device === 'temp') {
        if (action === 'increase') currentTemp += 2;
        if (action === 'decrease') currentTemp -= 2;
        document.getElementById('tempDisplay').textContent = currentTemp + '°F';
        statusDisplay.textContent = `🌡️ Temperature set to ${currentTemp}°F`;
    } else if (device === 'tv') {
        deviceStates.tv = action;
        statusDisplay.textContent = `📺 TV ${action}`;
    }
    statusDisplay.style.color = '#667eea';
}

// ==================== INFO FUNCTIONS ====================

function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) {
        alert('Please enter a search term');
        return;
    }
    performWebSearch(searchTerm);
}

function performWebSearch(term) {
    const url = `https://www.google.com/search?q=${encodeURIComponent(term)}`;
    window.open(url, '_blank');
    speak(`Searching for ${term}`);
    searchInput.value = '';
}

function getInfo(type) {
    if (type === 'weather') {
        getWeather();
    } else if (type === 'time') {
        getTimeVoice();
    } else if (type === 'date') {
        getDateVoice();
    } else if (type === 'news') {
        getNews();
    }
}

function getWeather() {
    const temperature = Math.round(Math.random() * 30 + 50);
    const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Clear'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const humidity = Math.round(Math.random() * 40 + 30);
    
    infoDisplay.innerHTML = `
        <h3>🌤️ Current Weather</h3>
        <p><strong>Temperature:</strong> ${temperature}°F</p>
        <p><strong>Condition:</strong> ${condition}</p>
        <p><strong>Humidity:</strong> ${humidity}%</p>
    `;
    speak(`The weather is ${condition} with a temperature of ${temperature} degrees and ${humidity} percent humidity`);
}

function getTimeVoice() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    infoDisplay.innerHTML = `<h3>⏰ Current Time</h3><p>${timeString}</p>`;
    speak(`The current time is ${timeString}`);
}

function getDateVoice() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    infoDisplay.innerHTML = `<h3>📅 Today's Date</h3><p>${dateString}</p>`;
    speak(`Today is ${dateString}`);
}

function getNews() {
    infoDisplay.innerHTML = `
        <h3>📰 Latest News</h3>
        <p>For real news, visit:</p>
        <ul>
            <li><a href="https://news.google.com" target="_blank">Google News</a></li>
            <li><a href="https://bbc.com/news" target="_blank">BBC News</a></li>
            <li><a href="https://cnn.com" target="_blank">CNN</a></li>
        </ul>
    `;
    speak('Opening news sources');
}

// ==================== UTILITY FUNCTIONS ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}