// Viewer Dashboard functionality
class ViewerDashboard {
    constructor() {
        this.downloadHistory = JSON.parse(localStorage.getItem('downloadHistory')) || [];
        this.checkViewerAccess();
        this.initializeDashboard();
    }
    
    checkViewerAccess() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !['viewer', 'admin'].includes(currentUser.role)) {
            alert('Access denied. Please login first.');
            window.location.href = 'login.html';
            return;
        }
    }
    
    initializeDashboard() {
        this.loadAvailableFiles();
        this.updateUserInfo();
        this.updateStats();
        this.displayRecentDownloads();
    }
    
    loadAvailableFiles() {
        const emulators = JSON.parse(localStorage.getItem('adminEmulators')) || [];
        const settings = JSON.parse(localStorage.getItem('adminSettings')) || [];
        const tools = JSON.parse(localStorage.getItem('adminTools')) || [];
        
        this.displayFiles('emulatorDownloads', emulators, 'emulator');
        this.displayFiles('settingsDownloads', settings, 'settings');
        this.displayFiles('toolsDownloads', tools, 'tools');
    }
    
    displayFiles(containerId, files, category) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        
        if (files.length === 0) {
            container.innerHTML = '<p class="empty-message">No files available yet</p>';
            return;
        }
        
        files.forEach(file => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'download-item';
            fileDiv.innerHTML = `
                <div class="download-info">
                    <div class="file-icon">${this.getFileIcon(file.name)}</div>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            ${this.formatFileSize(file.size)} • 
                            Uploaded: ${new Date(file.uploadDate).toLocaleDateString()} • 
                            ${file.downloadCount} downloads
                        </div>
                        <div class="file-description">
                            ${this.getFileDescription(file.name, category)}
                        </div>
                    </div>
                </div>
                <div class="download-actions">
                    <button class="btn-download" onclick="viewerDashboard.downloadFile('${file.id}', '${category}')">
                        <span class="download-icon">⬇️</span>
                        Download
                    </button>
                </div>
            `;
            
            fileDiv.style.cssText = `
                display: flex; justify-content: space-between; align-items: center;
                background: rgba(255, 255, 255, 0.05); border-radius: 10px;
                padding: 1rem; margin: 0.5rem 0; border: 1px solid rgba(255, 255, 255, 0.1);
                transition: all 0.3s ease;
            `;
            
            fileDiv.addEventListener('mouseenter', () => {
                fileDiv.style.transform = 'translateY(-2px)';
                fileDiv.style.boxShadow = '0 10px 30px rgba(0, 204, 255, 0.2)';
            });
            
            fileDiv.addEventListener('mouseleave', () => {
                fileDiv.style.transform = 'translateY(0)';
                fileDiv.style.boxShadow = 'none';
            });
            
            container.appendChild(fileDiv);
        });
    }
    
    downloadFile(fileId, category) {
        const files = JSON.parse(localStorage.getItem(`admin${category.charAt(0).toUpperCase() + category.slice(1)}s`)) || [];
        const file = files.find(f => f.id == fileId);
        
        if (!file) {
            this.showNotification('File not found!', 'error');
            return;
        }
        
        // Increment download count
        file.downloadCount = (file.downloadCount || 0) + 1;
        localStorage.setItem(`admin${category.charAt(0).toUpperCase() + category.slice(1)}s`, JSON.stringify(files));
        
        // Add to download history
        const downloadRecord = {
            id: Date.now(),
            fileName: file.name,
            category: category,
            downloadDate: new Date().toISOString(),
            fileSize: file.size
        };
        
        this.downloadHistory.unshift(downloadRecord);
        if (this.downloadHistory.length > 50) {
            this.downloadHistory = this.downloadHistory.slice(0, 50);
        }
        localStorage.setItem('downloadHistory', JSON.stringify(this.downloadHistory));
        
        // Simulate download
        this.showDownloadProgress(file);
        
        // Refresh displays
        this.loadAvailableFiles();
        this.updateStats();
        this.displayRecentDownloads();
    }
    
    showDownloadProgress(file) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'download-progress';
        progressDiv.innerHTML = `
            <div class="progress-header">
                <span class="progress-title">Downloading: ${file.name}</span>
                <span class="progress-size">${this.formatFileSize(file.size)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-text">0%</div>
        `;
        
        progressDiv.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; width: 350px;
            background: rgba(0, 0, 0, 0.9); border-radius: 10px; padding: 1rem;
            border: 1px solid rgba(0, 204, 255, 0.5); z-index: 10000;
            animation: slideInUp 0.3s ease;
        `;
        
        document.body.appendChild(progressDiv);
        
        let progress = 0;
        const progressFill = progressDiv.querySelector('.progress-fill');
        const progressText = progressDiv.querySelector('.progress-text');
        
        const interval = setInterval(() => {
            progress += Math.random() * 20 + 5;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                progressText.textContent = 'Complete!';
                setTimeout(() => {
                    progressDiv.style.animation = 'slideOutDown 0.3s ease';
                    setTimeout(() => progressDiv.remove(), 300);
                    this.showNotification(`${file.name} downloaded successfully!`, 'success');
                }, 1000);
            }
        }, 100);
    }
    
    updateStats() {
        const myDownloads = this.downloadHistory.length;
        const emulators = JSON.parse(localStorage.getItem('adminEmulators')) || [];
        const settings = JSON.parse(localStorage.getItem('adminSettings')) || [];
        const tools = JSON.parse(localStorage.getItem('adminTools')) || [];
        const availableFiles = emulators.length + settings.length + tools.length;
        
        document.getElementById('myDownloads').textContent = myDownloads;
        document.getElementById('availableFiles').textContent = availableFiles;
    }
    
    displayRecentDownloads() {
        const recentList = document.getElementById('recentList');
        if (!recentList) return;
        
        if (this.downloadHistory.length === 0) {
            recentList.innerHTML = '<p class="empty-message">No downloads yet</p>';
            return;
        }
        
        const recentDownloads = this.downloadHistory.slice(0, 5);
        recentList.innerHTML = recentDownloads.map(download => `
            <div class="recent-item">
                <div class="recent-info">
                    <span class="recent-name">${download.fileName}</span>
                    <span class="recent-date">${new Date(download.downloadDate).toLocaleDateString()}</span>
                </div>
                <span class="recent-category">${download.category}</span>
            </div>
        `).join('');
    }
    
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'apk': '📱', 'exe': '💻', 'msi': '💻',
            'zip': '📦', 'rar': '📦',
            'cfg': '⚙️', 'ini': '⚙️', 'conf': '⚙️',
            'json': '📄', 'xml': '📄', 'txt': '📄',
            'bat': '🔧', 'sh': '🔧', 'py': '🐍', 'js': '📜'
        };
        return icons[ext] || '📁';
    }
    
    getFileDescription(filename, category) {
        const ext = filename.split('.').pop().toLowerCase();
        const descriptions = {
            emulator: {
                'apk': 'Android emulator application',
                'exe': 'Windows emulator executable',
                'zip': 'Compressed emulator package'
            },
            settings: {
                'cfg': 'Configuration file',
                'ini': 'Settings file',
                'json': 'JSON configuration'
            },
            tools: {
                'exe': 'Optimization tool',
                'py': 'Python script',
                'bat': 'Batch script'
            }
        };
        
        return descriptions[category]?.[ext] || 'File for gaming optimization';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    updateUserInfo() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            const userProfile = document.getElementById('userProfile');
            if (userProfile) {
                userProfile.innerHTML = `Welcome, ${currentUser.username} <span class="premium-badge">VIEWER</span>`;
            }
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        const colors = {
            success: 'rgba(0, 255, 0, 0.9)',
            error: 'rgba(255, 0, 0, 0.9)',
            info: 'rgba(0, 204, 255, 0.9)'
        };
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        
        notification.innerHTML = `
            <span>${icons[type]}</span>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed; top: 100px; right: 20px;
            background: ${colors[type]}; color: white;
            padding: 1rem 1.5rem; border-radius: 10px;
            display: flex; align-items: center; gap: 0.5rem;
            z-index: 10000; animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

let viewerDashboard;
document.addEventListener('DOMContentLoaded', () => {
    viewerDashboard = new ViewerDashboard();
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .download-info { display: flex; align-items: center; gap: 1rem; flex: 1; }
        .file-details { flex: 1; }
        .file-name { font-weight: bold; color: #00ccff; margin-bottom: 0.3rem; }
        .file-meta { font-size: 0.8rem; color: #cccccc; margin-bottom: 0.3rem; }
        .file-description { font-size: 0.9rem; color: #aaaaaa; }
        .btn-download { 
            background: linear-gradient(45deg, #0066cc, #00ccff);
            color: white; border: none; padding: 0.8rem 1.5rem;
            border-radius: 25px; cursor: pointer; display: flex;
            align-items: center; gap: 0.5rem; transition: all 0.3s ease;
        }
        .btn-download:hover { 
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 204, 255, 0.4);
        }
        .progress-bar { 
            width: 100%; height: 8px; background: rgba(255, 255, 255, 0.1);
            border-radius: 4px; overflow: hidden; margin: 0.5rem 0;
        }
        .progress-fill { 
            height: 100%; background: linear-gradient(45deg, #0066cc, #00ccff);
            width: 0%; transition: width 0.3s ease;
        }
        .recent-item { 
            display: flex; justify-content: space-between; align-items: center;
            padding: 0.5rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .recent-name { font-weight: bold; color: #00ccff; }
        .recent-date { font-size: 0.8rem; color: #cccccc; }
        .recent-category { 
            background: rgba(0, 204, 255, 0.2); padding: 0.2rem 0.5rem;
            border-radius: 10px; font-size: 0.8rem;
        }
        @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideOutDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
    `;
    document.head.appendChild(style);
});