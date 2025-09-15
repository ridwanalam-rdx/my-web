// Unified Authentication Interface
class AuthInterface {
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
        
        this.users = JSON.parse(localStorage.getItem('registeredUsers')) || [];
        this.initializeInterface();
    }
    
    initializeInterface() {
        this.setupTabs();
        this.setupRoleSelector();
        this.setupInputEffects();
        this.checkExistingLogin();
    }
    
    setupTabs() {
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        loginTab.addEventListener('click', () => {
            loginTab.classList.add('active');
            registerTab.classList.remove('active');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        });
        
        registerTab.addEventListener('click', () => {
            registerTab.classList.add('active');
            loginTab.classList.remove('active');
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        });
    }
    
    setupRoleSelector() {
        const adminRole = document.getElementById('adminRole');
        const viewerRole = document.getElementById('viewerRole');
        const keyHint = document.getElementById('keyHint');
        
        adminRole.addEventListener('change', () => {
            if (adminRole.checked) {
                keyHint.innerHTML = 'Contact administrator for admin registration key';
                keyHint.style.color = '#ff6b35';
            }
        });
        
        viewerRole.addEventListener('change', () => {
            if (viewerRole.checked) {
                keyHint.innerHTML = 'Contact administrator for viewer registration key';
                keyHint.style.color = '#00ccff';
            }
        });
    }
    
    setupInputEffects() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', (e) => {
                const inputGlow = e.target.nextElementSibling;
                if (inputGlow && inputGlow.classList.contains('input-glow')) {
                    inputGlow.style.width = '100%';
                }
            });
            
            input.addEventListener('blur', (e) => {
                const inputGlow = e.target.nextElementSibling;
                if (inputGlow && inputGlow.classList.contains('input-glow')) {
                    inputGlow.style.width = '0';
                }
            });
        });
    }
    
    checkExistingLogin() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (isLoggedIn && currentUser) {
            if (currentUser.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'viewer-dashboard.html';
            }
        }
    }
    
    validateRegistrationKey(key, expectedRole) {
        const upperKey = key.toUpperCase();
        if (expectedRole === 'admin') {
            return this.adminKeys.includes(upperKey);
        } else {
            return this.viewerKeys.includes(upperKey);
        }
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
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }
    
    userExists(username, email) {
        return this.users.some(user => 
            user.username.toLowerCase() === username.toLowerCase() || 
            user.email.toLowerCase() === email.toLowerCase()
        );
    }
    
    handleLogin(formData) {
        const username = formData.get('username').trim();
        const password = formData.get('password');
        
        const user = this.users.find(u => 
            (u.username.toLowerCase() === username.toLowerCase() || 
             u.email.toLowerCase() === username.toLowerCase()) &&
            u.password === this.hashPassword(password)
        );
        
        if (!user) {
            this.showMessage('Invalid username/email or password.', 'error');
            return;
        }
        
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isPremium: user.isPremium
        }));
        
        this.showMessage('Login successful! Redirecting...', 'success');
        
        setTimeout(() => {
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'viewer-dashboard.html';
            }
        }, 1500);
    }
    
    handleRegister(formData) {
        const accountType = formData.get('accountType');
        const regKey = formData.get('regKey').trim();
        const username = formData.get('username').trim();
        const email = formData.get('email').trim();
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        // Validation
        if (!this.validateRegistrationKey(regKey, accountType)) {
            this.showMessage(`Invalid ${accountType} registration key.`, 'error');
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showMessage('Please enter a valid email address.', 'error');
            return;
        }
        
        if (!this.validatePassword(password)) {
            this.showMessage('Password must be 8+ characters with uppercase, lowercase, and number.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showMessage('Passwords do not match.', 'error');
            return;
        }
        
        if (this.userExists(username, email)) {
            this.showMessage('Username or email already exists.', 'error');
            return;
        }
        
        // Check user limits
        const userRole = this.getUserRole(regKey);
        const limitCheck = this.checkUserLimits(userRole);
        
        if (!limitCheck.allowed) {
            this.showMessage(limitCheck.message, 'error');
            return;
        }
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
        
        this.showMessage('Registration successful! Switching to login...', 'success');
        
        setTimeout(() => {
            document.getElementById('loginTab').click();
            document.getElementById('loginUsername').value = username;
        }, 2000);
    }
    
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }
    
    showMessage(message, type) {
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
        
        messageDiv.style.cssText = `
            position: fixed; top: 100px; right: 20px;
            background: ${type === 'error' ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 255, 0, 0.9)'};
            color: white; padding: 1rem 1.5rem; border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); z-index: 10000;
            animation: slideIn 0.3s ease; backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => messageDiv.remove(), 300);
            }
        }, 5000);
    }
}

// Global functions for form handling
function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    authInterface.handleLogin(formData);
}

function handleRegister(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    authInterface.handleRegister(formData);
}

// Initialize
let authInterface;
document.addEventListener('DOMContentLoaded', () => {
    authInterface = new AuthInterface();
});