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

// State
let todos = [];
let currentFilter = 'all';
const STORAGE_KEY = 'todos';

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

// Voice Command Handler
function handleVoiceCommand(command) {
    voiceStatus.textContent = `📝 Command: "${command}"`;
    voiceStatus.style.color = '#667eea';
    
    // Add task
    if (command.startsWith('add ')) {
        const taskName = command.substring(4).trim();
        if (taskName) {
            todoInput.value = taskName;
            addTodo();
            speak(`Task "${taskName}" added successfully`);
        }
    }
    // List tasks
    else if (command.includes('list') || command.includes('show all') || command.includes('show tasks')) {
        filterBtns[0].click();
        listTasksAloud();
    }
    // List active
    else if (command.includes('list active') || command.includes('show active')) {
        filterBtns[1].click();
        listTasksAloud();
    }
    // List completed
    else if (command.includes('list completed') || command.includes('show completed')) {
        filterBtns[2].click();
        listTasksAloud();
    }
    // Complete task
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
    // Delete task
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
    // Task count
    else if (command.includes('how many') || command.includes('count')) {
        const total = todos.length;
        const active = todos.filter(t => !t.completed).length;
        speak(`You have ${total} total tasks. ${active} are still active.`);
    }
    // Clear completed
    else if (command.includes('clear completed')) {
        clearCompleted();
        speak('Completed tasks cleared');
    }
    // Help
    else if (command.includes('help') || command.includes('commands')) {
        const commands = [
            'You can add tasks by saying: add buy groceries',
            'List all tasks by saying: list tasks',
            'Show active tasks by saying: list active',
            'Mark task complete by saying: complete 1',
            'Delete a task by saying: delete 1',
            'Check task count by saying: how many tasks',
        ];
        speak(commands.join('. '));
    }
    else {
        voiceStatus.textContent = '❓ Command not recognized. Try "help" for available commands.';
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

// Functions
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

// Local Storage Functions
function saveTodos() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
    const stored = localStorage.getItem(STORAGE_KEY);
    todos = stored ? JSON.parse(stored) : [];
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}