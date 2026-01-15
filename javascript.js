class Calculator {
    constructor() {
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.waitingForNewInput = false;
        this.memory = 0;
        this.isScientificMode = false;
        this.history = [];
        this.decimalAdded = false;
        
        this.displayElement = document.getElementById('current-input');
        this.operationIndicator = document.getElementById('operation-indicator');
        this.memoryIndicator = document.getElementById('memory-indicator');
        this.historyList = document.getElementById('history-list');
        this.modeIndicator = document.getElementById('mode-indicator');
        this.scientificPanel = document.getElementById('scientific-panel');
        this.themeToggle = document.getElementById('theme-toggle');
        
        this.init();
    }
    
    init() {
        this.updateDisplay();
        this.setupEventListeners();
        this.loadHistory();
        this.setupThemeToggle();
    }
    
    setupThemeToggle() {
        // Check for saved theme preference or default to day
        const savedTheme = localStorage.getItem('calculatorTheme');
        if (savedTheme === 'night') {
            document.body.classList.add('night-mode');
            document.body.classList.remove('day-mode');
            this.themeToggle.innerHTML = '<i class="fas fa-moon"></i> Night Mode';
        } else {
            document.body.classList.add('day-mode');
            this.themeToggle.innerHTML = '<i class="fas fa-sun"></i> Day Mode';
        }
        
        this.themeToggle.addEventListener('click', () => {
            if (document.body.classList.contains('day-mode')) {
                // Switch to night mode
                document.body.classList.remove('day-mode');
                document.body.classList.add('night-mode');
                this.themeToggle.innerHTML = '<i class="fas fa-moon"></i> Night Mode';
                localStorage.setItem('calculatorTheme', 'night');
            } else {
                // Switch to day mode
                document.body.classList.remove('night-mode');
                document.body.classList.add('day-mode');
                this.themeToggle.innerHTML = '<i class="fas fa-sun"></i> Day Mode';
                localStorage.setItem('calculatorTheme', 'day');
            }
        });
    }
    
    setupEventListeners() {
        // Number buttons
        document.querySelectorAll('.number-btn').forEach(button => {
            button.addEventListener('click', () => {
                const number = button.getAttribute('data-number');
                this.inputNumber(number);
            });
        });
        
        // Operator buttons
        document.querySelectorAll('.operator-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.handleOperator(action);
            });
        });
        
        // Function buttons (including clear buttons)
        document.querySelectorAll('.scientific-btn, .clear-btn, .memory-btn, .equals-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.handleFunction(action);
            });
        });
        
        // Mode toggle
        document.getElementById('mode-toggle').addEventListener('click', () => {
            this.toggleScientificMode();
        });
        
        // Scientific panel buttons
        document.querySelectorAll('.sci-btn').forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.handleScientificFunction(action);
            });
        });
        
        // History clear button
        document.getElementById('clear-history').addEventListener('click', () => {
            this.clearHistory();
        });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardInput(e);
        });
        
        // Close scientific panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isScientificMode && 
                !e.target.closest('.scientific-panel') && 
                !e.target.closest('#mode-toggle')) {
                this.toggleScientificMode();
            }
        });
    }
    
    inputNumber(num) {
        if (this.waitingForNewInput) {
            this.currentInput = num;
            this.waitingForNewInput = false;
            this.decimalAdded = num === '.' ? true : false;
        } else {
            if (this.currentInput === '0' && num !== '.') {
                this.currentInput = num;
            } else if (num === '.') {
                if (!this.decimalAdded) {
                    this.currentInput += num;
                    this.decimalAdded = true;
                }
            } else {
                // Limit input length to prevent overflow
                if (this.currentInput.length < 12) {
                    this.currentInput += num;
                }
            }
        }
        
        this.updateDisplay();
    }
    
    handleOperator(op) {
        const inputValue = parseFloat(this.currentInput);
        
        switch(op) {
            case 'add':
                this.performOperation('+');
                break;
            case 'subtract':
                this.performOperation('−');
                break;
            case 'multiply':
                this.performOperation('×');
                break;
            case 'divide':
                this.performOperation('÷');
                break;
            case 'percentage':
                this.currentInput = (inputValue / 100).toString();
                this.updateDisplay();
                break;
            case 'plus-minus':
                this.currentInput = (-inputValue).toString();
                this.updateDisplay();
                break;
            case 'backspace':
                if (this.currentInput.length > 1) {
                    if (this.currentInput.slice(-1) === '.') {
                        this.decimalAdded = false;
                    }
                    this.currentInput = this.currentInput.slice(0, -1);
                } else {
                    this.currentInput = '0';
                }
                this.updateDisplay();
                break;
        }
    }
    
    handleFunction(func) {
        const inputValue = parseFloat(this.currentInput);
        
        switch(func) {
            case 'clear-all':
                this.clearAll();
                break;
                
            case 'clear-entry':
                this.clearEntry();
                break;
                
            case 'equals':
                if (this.operation && this.previousInput !== '') {
                    const result = this.calculate();
                    this.currentInput = result.toString();
                    this.previousInput = '';
                    this.operation = null;
                    this.waitingForNewInput = true;
                    this.addToHistory(result);
                    this.updateDisplay();
                    this.operationIndicator.textContent = '';
                }
                break;
                
            case 'sqrt':
                if (inputValue >= 0) {
                    this.currentInput = Math.sqrt(inputValue).toString();
                    this.addToHistory(this.currentInput, '√');
                } else {
                    this.showError('Invalid input for square root');
                }
                this.updateDisplay();
                break;
                
            case 'square':
                this.currentInput = (inputValue * inputValue).toString();
                this.addToHistory(this.currentInput, 'x²');
                this.updateDisplay();
                break;
                
            case 'reciprocal':
                if (inputValue !== 0) {
                    this.currentInput = (1 / inputValue).toString();
                    this.addToHistory(this.currentInput, '1/x');
                } else {
                    this.showError('Cannot divide by zero');
                }
                this.updateDisplay();
                break;
                
            case 'memory-clear':
                this.memory = 0;
                this.updateMemoryIndicator();
                break;
                
            case 'memory-recall':
                this.currentInput = this.memory.toString();
                this.updateDisplay();
                break;
                
            case 'memory-add':
                this.memory += inputValue;
                this.updateMemoryIndicator();
                break;
                
            case 'memory-subtract':
                this.memory -= inputValue;
                this.updateMemoryIndicator();
                break;
        }
    }
    
    clearAll() {
        // Clear everything: display, operation, memory
        this.currentInput = '0';
        this.previousInput = '';
        this.operation = null;
        this.waitingForNewInput = false;
        this.decimalAdded = false;
        this.operationIndicator.textContent = '';
        this.updateDisplay();
        this.showMessage('All cleared');
    }
    
    clearEntry() {
        // Clear only current entry
        this.currentInput = '0';
        this.decimalAdded = false;
        this.updateDisplay();
        this.showMessage('Entry cleared');
    }
    
    performOperation(nextOperation) {
        const inputValue = parseFloat(this.currentInput);
        
        if (this.previousInput === '') {
            this.previousInput = this.currentInput;
        } else if (this.operation) {
            const result = this.calculate();
            this.currentInput = result.toString();
            this.previousInput = result.toString();
            this.addToHistory(result);
        }
        
        this.waitingForNewInput = true;
        this.operation = nextOperation;
        this.operationIndicator.textContent = `${this.previousInput} ${this.operation}`;
        this.updateDisplay();
    }
    
    handleScientificFunction(func) {
        const inputValue = parseFloat(this.currentInput);
        let result;
        
        switch(func) {
            case 'sin':
                result = Math.sin(inputValue * Math.PI / 180);
                this.addToHistory(result, 'sin');
                break;
            case 'cos':
                result = Math.cos(inputValue * Math.PI / 180);
                this.addToHistory(result, 'cos');
                break;
            case 'tan':
                result = Math.tan(inputValue * Math.PI / 180);
                this.addToHistory(result, 'tan');
                break;
            case 'log':
                if (inputValue > 0) {
                    result = Math.log10(inputValue);
                    this.addToHistory(result, 'log');
                } else {
                    this.showError('Invalid input for logarithm');
                    return;
                }
                break;
            case 'ln':
                if (inputValue > 0) {
                    result = Math.log(inputValue);
                    this.addToHistory(result, 'ln');
                } else {
                    this.showError('Invalid input for natural log');
                    return;
                }
                break;
            case 'pi':
                result = Math.PI;
                this.addToHistory('π', 'constant');
                break;
            case 'e':
                result = Math.E;
                this.addToHistory('e', 'constant');
                break;
            case 'factorial':
                if (inputValue >= 0 && Number.isInteger(inputValue)) {
                    result = this.factorial(inputValue);
                    this.addToHistory(result, 'x!');
                } else {
                    this.showError('Invalid input for factorial');
                    return;
                }
                break;
            case 'abs':
                result = Math.abs(inputValue);
                this.addToHistory(result, '|x|');
                break;
            case 'exp':
                result = Math.exp(inputValue);
                this.addToHistory(result, 'eˣ');
                break;
            case 'power':
                this.performOperation('xʸ');
                return;
        }
        
        if (result !== undefined) {
            this.currentInput = result.toString();
            this.updateDisplay();
        }
        
        // Close scientific panel after operation
        this.toggleScientificMode();
    }
    
    calculate() {
        const prev = parseFloat(this.previousInput);
        const current = parseFloat(this.currentInput);
        
        if (isNaN(prev) || isNaN(current)) return '';
        
        let computation;
        switch(this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '−':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    this.showError('Cannot divide by zero');
                    return 'Error';
                }
                computation = prev / current;
                break;
            case 'xʸ':
                computation = Math.pow(prev, current);
                break;
            default:
                return '';
        }
        
        // Round to avoid floating point precision issues
        return Math.round(computation * 100000000) / 100000000;
    }
    
    factorial(n) {
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) {
            result *= i;
        }
        return result;
    }
    
    toggleScientificMode() {
        this.isScientificMode = !this.isScientificMode;
        this.scientificPanel.classList.toggle('active', this.isScientificMode);
        
        if (this.isScientificMode) {
            this.modeIndicator.textContent = 'Scientific Mode';
            document.getElementById('mode-toggle').innerHTML = '<i class="fas fa-times"></i> Basic';
        } else {
            this.modeIndicator.textContent = 'Basic Mode';
            document.getElementById('mode-toggle').innerHTML = '<i class="fas fa-calculator"></i> Sci';
        }
    }
    
    updateDisplay() {
        // Format the display with commas for thousands
        let displayValue = this.currentInput;
        
        // Remove any existing commas
        displayValue = displayValue.replace(/,/g, '');
        
        // Split into integer and decimal parts
        let [integer, decimal] = displayValue.split('.');
        
        // Add commas to integer part
        integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        // Recombine with decimal if it exists
        displayValue = decimal !== undefined ? `${integer}.${decimal}` : integer;
        
        this.displayElement.textContent = displayValue;
        
        // Add highlight animation when value changes
        this.displayElement.classList.remove('highlight');
        void this.displayElement.offsetWidth; // Trigger reflow
        this.displayElement.classList.add('highlight');
    }
    
    updateMemoryIndicator() {
        if (this.memory !== 0) {
            this.memoryIndicator.textContent = `M = ${this.memory}`;
            this.memoryIndicator.classList.add('active');
        } else {
            this.memoryIndicator.classList.remove('active');
        }
    }
    
    addToHistory(result, operation = null) {
        let historyEntry;
        
        if (operation) {
            if (operation === 'constant') {
                historyEntry = {
                    expression: result,
                    result: result,
                    timestamp: new Date().toLocaleTimeString()
                };
            } else {
                historyEntry = {
                    expression: `${operation}(${this.currentInput})`,
                    result: result,
                    timestamp: new Date().toLocaleTimeString()
                };
            }
        } else {
            historyEntry = {
                expression: `${this.previousInput} ${this.operation} ${this.currentInput}`,
                result: result,
                timestamp: new Date().toLocaleTimeString()
            };
        }
        
        this.history.unshift(historyEntry);
        
        // Keep only last 10 history items
        if (this.history.length > 10) {
            this.history.pop();
        }
        
        this.updateHistoryDisplay();
        this.saveHistory();
    }
    
    updateHistoryDisplay() {
        this.historyList.innerHTML = '';
        
        this.history.forEach((item, index) => {
            const li = document.createElement('div');
            li.className = 'history-item';
            li.innerHTML = `
                <span class="history-expression">${item.expression}</span>
                <span class="history-result">${item.result}</span>
            `;
            
            li.addEventListener('click', () => {
                this.currentInput = item.result.toString();
                this.updateDisplay();
            });
            
            this.historyList.appendChild(li);
        });
    }
    
    clearHistory() {
        this.history = [];
        this.updateHistoryDisplay();
        this.saveHistory();
        this.showMessage('History cleared');
    }
    
    saveHistory() {
        try {
            localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    }
    
    loadHistory() {
        try {
            const savedHistory = localStorage.getItem('calculatorHistory');
            if (savedHistory) {
                this.history = JSON.parse(savedHistory);
                this.updateHistoryDisplay();
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    }
    
    handleKeyboardInput(e) {
        e.preventDefault();
        
        if (e.key >= '0' && e.key <= '9') {
            this.inputNumber(e.key);
        } else if (e.key === '.') {
            this.inputNumber('.');
        } else if (e.key === '+') {
            this.handleOperator('add');
        } else if (e.key === '-') {
            this.handleOperator('subtract');
        } else if (e.key === '*') {
            this.handleOperator('multiply');
        } else if (e.key === '/') {
            this.handleOperator('divide');
        } else if (e.key === 'Enter' || e.key === '=') {
            this.handleFunction('equals');
        } else if (e.key === 'Escape' || e.key === 'Delete') {
            this.handleFunction('clear-all');
        } else if (e.key === 'Backspace') {
            this.handleOperator('backspace');
        } else if (e.key === '%') {
            this.handleOperator('percentage');
        } else if (e.key === 'm' || e.key === 'M') {
            // Toggle scientific mode with 'm' key
            this.toggleScientificMode();
        } else if (e.key === 't' || e.key === 'T') {
            // Toggle theme with 't' key
            this.themeToggle.click();
        } else if (e.key === 'c' || e.key === 'C') {
            // Clear entry with 'c' key
            this.handleFunction('clear-entry');
        }
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showMessage(message) {
        this.showNotification(message, 'info');
    }
    
    showNotification(message, type) {
        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'notification-message';
        notificationDiv.textContent = message;
        
        const isNightMode = document.body.classList.contains('night-mode');
        
        notificationDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 80px;
            background: ${type === 'error' ? 
                (isNightMode ? '#ef4444' : '#dc2626') : 
                (isNightMode ? '#3b82f6' : '#2563eb')};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
            backdrop-filter: blur(10px);
            border: 2px solid ${type === 'error' ? 
                (isNightMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)') : 
                (isNightMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(37, 99, 235, 0.3)')};
        `;
        
        document.body.appendChild(notificationDiv);
        
        setTimeout(() => {
            notificationDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(notificationDiv)) {
                    document.body.removeChild(notificationDiv);
                }
            }, 300);
        }, 2000);
        
        // Add CSS for animations if not already present
        if (!document.querySelector('#notification-animations')) {
            const style = document.createElement('style');
            style.id = 'notification-animations';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Initialize calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});