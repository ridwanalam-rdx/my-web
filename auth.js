// Authentication System
class AuthSystem {
    constructor() {
        this.adminKeys = [
            'ADMIN-MASTER-2024',
            'GAMEFORGE-ADMIN-001'
        ];
        
        this.viewerKeys = [
            'GAMEFORGE-PREMIUM-2024',
            'ELITE-GAMER-ACCESS-001',
            'PRO-DEVELOPER-KEY-999',
            'MASTER-BUILDER-2024',
            'ULTIMATE-ACCESS-VIP',
            'GAMING-LEGEND-2024',
            'PREMIUM-ACCESS-777',
            'VIP-MEMBER-2024',
            'EXCLUSIVE-KEY-888',
            'DEVELOPER-SPECIAL-999'
        ];
        
        this.maxAdmins = 1;
        this.maxViewers = 1000000;
        
        this.users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        this.initializeAuth();
    }
    
    initializeAuth() {
        // Check if user is already logged in
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = localStorage.getItem('currentUser');
        
        if (isLoggedIn && currentUser && window.location.pathname.includes('dashboard')) {
            this.updateUserProfile(JSON.parse(currentUser));
        } else if (isLoggedIn && !window.location.pathname.includes('dashboard')) {
            // Redirect to dashboard if logged in but not on dashboard
            if (!window.location.pathname.includes('index')) {
                window.location.href = 'dashboard.html';
            }
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }
        
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Input focus effects
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', this.handleInputFocus);
            input.addEventListener('blur', this.handleInputBlur);
        });
    }
    
    handleInputFocus(e) {
        const inputGlow = e.target.nextElementSibling;
        if (inputGlow && inputGlow.classList.contains('input-glow')) {
            inputGlow.style.width = '100%';
        }
    }
    
    handleInputBlur(e) {
        const inputGlow = e.target.nextElementSibling;
        if (inputGlow && inputGlow.classList.contains('input-glow')) {
            inputGlow.style.width = '0';
        }
    }
    
    validateRegistrationKey(key) {
        const upperKey = key.toUpperCase();
        return this.adminKeys.includes(upperKey) || this.viewerKeys.includes(upperKey);
    }
    
    getUserRole(key) {
        const upperKey = key.toUpperCase();
        if (this.adminKeys.includes(upperKey)) return 'admin';
        if (this.viewerKeys.includes(upperKey)) return 'viewer';
        return null;
    }
    
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }
    
    userExists(username, email) {
        return this.users.some(user => 
            user.username.toLowerCase() === username.toLowerCase() || 
            user.email.toLowerCase() === email.toLowerCase()
        );
    }
    
    checkUserLimits(role) {
        const adminCount = this.users.filter(user => user.role === 'admin').length;
        const viewerCount = this.users.filter(user => user.role === 'viewer').length;
        
        if (role === 'admin' && adminCount >= this.maxAdmins) {
            return { allowed: false, message: 'Maximum admin limit reached (1 admin maximum)' };
        }
        
        if (role === 'viewer' && viewerCount >= this.maxViewers) {
            return { allowed: false, message: 'Maximum viewer limit reached (1,000,000 viewers maximum)' };
        }
        
        return { allowed: true };
    }
    
    handleRegistration(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const regKey = formData.get('regKey').trim();
        const username = formData.get('username').trim();
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        // Validation
        if (!this.validateRegistrationKey(regKey)) {
            this.showError('Invalid registration key. Please contact the administrator.');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address.');
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showError('Password must be at least 8 characters with uppercase, lowercase, and number.');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('Passwords do not match.');
            return;
        }
        
        if (this.userExists(username, email)) {
            this.showError('Username or email already exists.');
            return;
        }
        
        // Check user limits
        const userRole = this.getUserRole(regKey);
        const limitCheck = this.checkUserLimits(userRole);
        
        if (!limitCheck.allowed) {
            this.showError(limitCheck.message);
            return;
        }
        
        // Create user
        const newUser = {
            id: Date.now(),
            username,
            email,
            password: this.hashPassword(password),
            registrationKey: regKey,
            role: userRole,
            createdAt: new Date().toISOString(),
            isPremium: true
        };
        
        this.users.push(newUser);
        localStorage.setItem('registeredUsers', JSON.stringify(this.users));
        
        this.showSuccess('Registration successful! You can now login.');
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    }
    
    handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username').trim();
        const password = formData.get('password');
        const rememberMe = formData.get('rememberMe') === 'on';
        
        // Find user
        const user = this.users.find(u => 
            (u.username.toLowerCase() === username.toLowerCase() || 
             u.email.toLowerCase() === username.toLowerCase()) &&
            u.password === this.hashPassword(password)
        );
        
        if (!user) {
            this.showError('Invalid username/email or password.');
            return;
        }
        
        // Login successful
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium
        }));
        
        if (rememberMe) {
            localStorage.setItem('rememberUser', 'true');
        }
        
        this.showSuccess('Login successful! Redirecting...');
        
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'viewer-dashboard.html';
            }
        }, 1500);
    }
    
    hashPassword(password) {
        // Simple hash function (in production, use proper hashing like bcrypt)
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    showError(message) {
        this.showMessage(message, 'error');
    }
    
    showSuccess(message) {
        this.showMessage(message, 'success');
    }
    
    showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.auth-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.innerHTML = `
            <div class="message-content">
                <span class="message-icon">${type === 'error' ? '❌' : '✅'}</span>
                <span class="message-text">${message}</span>
            </div>
        `;
        
        // Add styles
        messageDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 255, 0, 0.9)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 5000);
    }
    
    updateUserProfile(user) {
        const userProfile = document.getElementById('userProfile');
        if (userProfile) {
            userProfile.textContent = `Welcome, ${user.username}`;
            if (user.isPremium) {
                userProfile.innerHTML += ' <span class="premium-badge">PREMIUM</span>';
            }
        }
    }
    
    logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('rememberUser');
        window.location.href = 'index.html';
    }
}

// Global logout function
function logout() {
    if (window.authSystem) {
        window.authSystem.logout();
    }
}

// Initialize authentication system
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .message-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .message-icon {
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(style);
});

// Protect dashboard page
if (window.location.pathname.includes('dashboard')) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!isLoggedIn) {
        alert('Please login to access the dashboard.');
        window.location.href = 'login.html';
    }
}