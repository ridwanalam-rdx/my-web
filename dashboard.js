// Dashboard functionality
class Dashboard {
    constructor() {
        this.uploadedFiles = {
            apk: JSON.parse(localStorage.getItem('uploadedApk')) || [],
            exe: JSON.parse(localStorage.getItem('uploadedExe')) || [],
            settings: JSON.parse(localStorage.getItem('uploadedSettings')) || []
        };
        
        this.initializeDashboard();
    }
    
    initializeDashboard() {
        this.setupFileUploads();
        this.displayUploadedFiles();
        this.updateUserInfo();
        this.startPerformanceMonitoring();
    }
    
    setupFileUploads() {
        const uploadTypes = ['apk', 'exe', 'settings'];
        
        uploadTypes.forEach(type => {
            const uploadArea = document.getElementById(`${type}Upload`);
            const fileInput = document.getElementById(`${type}File`);
            const uploadBtn = uploadArea?.querySelector('.btn-upload');
            
            if (uploadArea && fileInput) {
                uploadArea.addEventListener('click', () => fileInput.click());
                uploadArea.addEventListener('dragover', this.handleDragOver);
                uploadArea.addEventListener('drop', (e) => this.handleDrop(e, type));
                fileInput.addEventListener('change', (e) => this.handleFileSelect(e, type));
                uploadBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    fileInput.click();
                });
            }
        });
    }
    
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.style.borderColor = '#00ccff';
        e.currentTarget.style.background = 'rgba(0, 204, 255, 0.1)';
    }
    
    handleDrop(e, type) {
        e.preventDefault();
        e.currentTarget.style.borderColor = 'rgba(0, 204, 255, 0.5)';
        e.currentTarget.style.background = 'transparent';
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files, type);
    }
    
    handleFileSelect(e, type) {
        const files = Array.from(e.target.files);
        this.processFiles(files, type);
    }
    
    processFiles(files, type) {
        const validExtensions = {
            apk: ['.apk'],
            exe: ['.exe', '.msi'],
            settings: ['.cfg', '.ini', '.json', '.xml', '.conf', '.bat', '.sh', '.py']
        };
        
        const maxSizes = {
            apk: 500 * 1024 * 1024, // 500MB for APK
            exe: 200 * 1024 * 1024, // 200MB for EXE
            settings: 50 * 1024 * 1024 // 50MB for settings
        };
        
        files.forEach(file => {
            // Validate file type
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            if (!validExtensions[type].includes(fileExt)) {
                this.showNotification(`Invalid file type: ${file.name}`, 'error');
                return;
            }
            
            // Validate file size
            const maxSize = maxSizes[type];
            if (file.size > maxSize) {
                const maxSizeMB = Math.round(maxSize / (1024 * 1024));
                this.showNotification(`File too large: ${file.name} (max ${maxSizeMB}MB)`, 'error');
                return;
            }
            
            // Simulate file upload
            this.uploadFile(file, type);
        });
    }
    
    uploadFile(file, type) {
        const fileInfo = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date().toISOString(),
            category: type
        };
        
        // Show upload progress
        this.showUploadProgress(fileInfo);
        
        // Simulate upload delay
        setTimeout(() => {
            this.uploadedFiles[type].push(fileInfo);
            localStorage.setItem(`uploaded${type.charAt(0).toUpperCase() + type.slice(1)}`, 
                               JSON.stringify(this.uploadedFiles[type]));
            
            this.displayUploadedFiles();
            this.showNotification(`${file.name} uploaded successfully!`, 'success');
        }, 2000 + Math.random() * 3000);
    }
    
    showUploadProgress(fileInfo) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'upload-progress';
        progressDiv.innerHTML = `
            <div class="progress-info">
                <span class="file-name">${fileInfo.name}</span>
                <span class="file-size">${this.formatFileSize(fileInfo.size)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-text">0%</div>
        `;
        
        progressDiv.style.cssText = `
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 1rem;
            margin: 0.5rem 0;
            border: 1px solid rgba(0, 204, 255, 0.3);
        `;
        
        const container = document.getElementById(`${fileInfo.category}Files`);
        container.appendChild(progressDiv);
        
        // Animate progress
        let progress = 0;
        const progressFill = progressDiv.querySelector('.progress-fill');
        const progressText = progressDiv.querySelector('.progress-text');
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    progressDiv.remove();
                }, 1000);
            }
        }, 200);
    }
    
    displayUploadedFiles() {
        ['apk', 'exe', 'settings'].forEach(type => {
            const container = document.getElementById(`${type}Files`);
            if (!container) return;
            
            // Clear existing files (except progress bars)
            const existingFiles = container.querySelectorAll('.uploaded-file');
            existingFiles.forEach(file => file.remove());
            
            this.uploadedFiles[type].forEach(file => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'uploaded-file';
                fileDiv.innerHTML = `
                    <div class="file-info">
                        <div class="file-icon">${this.getFileIcon(file.name)}</div>
                        <div class="file-details">
                            <div class="file-name">${file.name}</div>
                            <div class="file-meta">
                                ${this.formatFileSize(file.size)} • 
                                ${new Date(file.uploadDate).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div class="file-actions">
                        <button class="btn-download-file" onclick="dashboard.downloadFile('${file.id}', '${type}')">
                            Download
                        </button>
                        <button class="btn-delete-file" onclick="dashboard.deleteFile('${file.id}', '${type}')">
                            Delete
                        </button>
                    </div>
                `;
                
                fileDiv.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 8px;
                    padding: 0.8rem;
                    margin: 0.5rem 0;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.3s ease;
                `;
                
                container.appendChild(fileDiv);
            });
        });
    }
    
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'apk': '📱',
            'exe': '💻', 'msi': '💻',
            'cfg': '⚙️', 'ini': '⚙️', 'conf': '⚙️',
            'json': '📄', 'xml': '📄',
            'bat': '🔧', 'sh': '🔧',
            'py': '🐍', 'js': '📜'
        };
        return icons[ext] || '📁';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    downloadFile(fileId, type) {
        const file = this.uploadedFiles[type].find(f => f.id == fileId);
        if (file) {
            this.showNotification(`Downloading ${file.name}...`, 'info');
            // Simulate download
            setTimeout(() => {
                this.showNotification(`${file.name} downloaded!`, 'success');
            }, 1000);
        }
    }
    
    deleteFile(fileId, type) {
        if (confirm('Are you sure you want to delete this file?')) {
            this.uploadedFiles[type] = this.uploadedFiles[type].filter(f => f.id != fileId);
            localStorage.setItem(`uploaded${type.charAt(0).toUpperCase() + type.slice(1)}`, 
                               JSON.stringify(this.uploadedFiles[type]));
            this.displayUploadedFiles();
            this.showNotification('File deleted successfully!', 'success');
        }
    }
    
    updateUserInfo() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            const userProfile = document.getElementById('userProfile');
            if (userProfile) {
                userProfile.innerHTML = `
                    Welcome, ${currentUser.username} 
                    ${currentUser.isPremium ? '<span class="premium-badge">PREMIUM</span>' : ''}
                `;
            }
        }
    }
    
    startPerformanceMonitoring() {
        // Simulate real-time performance data
        const updateMetrics = () => {
            const metrics = [
                { name: 'CPU Usage', element: document.querySelector('.metric:nth-child(1)') },
                { name: 'GPU Usage', element: document.querySelector('.metric:nth-child(2)') },
                { name: 'Memory', element: document.querySelector('.metric:nth-child(3)') }
            ];
            
            metrics.forEach(metric => {
                if (metric.element) {
                    const value = Math.floor(Math.random() * 40) + 30; // 30-70%
                    const fill = metric.element.querySelector('.metric-fill');
                    const valueSpan = metric.element.querySelector('.metric-value');
                    
                    if (fill && valueSpan) {
                        fill.style.width = value + '%';
                        valueSpan.textContent = value + '%';
                        
                        // Color coding based on usage
                        if (value > 80) {
                            fill.style.background = 'linear-gradient(45deg, #ff4444, #ff6666)';
                        } else if (value > 60) {
                            fill.style.background = 'linear-gradient(45deg, #ffaa00, #ffcc44)';
                        } else {
                            fill.style.background = 'linear-gradient(45deg, #0066cc, #00ccff)';
                        }
                    }
                }
            });
        };
        
        // Update every 3 seconds
        updateMetrics();
        setInterval(updateMetrics, 3000);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const colors = {
            success: 'rgba(0, 255, 0, 0.9)',
            error: 'rgba(255, 0, 0, 0.9)',
            info: 'rgba(0, 204, 255, 0.9)'
        };
        
        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type]}</span>
            <span class="notification-text">${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            animation: slideInRight 0.3s ease;
            backdrop-filter: blur(10px);
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    
    // Add notification animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
            margin: 0.5rem 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(45deg, #0066cc, #00ccff);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .progress-info {
            display: flex;
            justify-content: space-between;
            font-size: 0.9rem;
        }
        
        .file-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .file-details {
            flex: 1;
        }
        
        .file-name {
            font-weight: bold;
            color: #00ccff;
        }
        
        .file-meta {
            font-size: 0.8rem;
            color: #cccccc;
        }
        
        .file-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .upload-options {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
            justify-content: center;
        }
        
        .upload-mode-btn {
            padding: 0.5rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            color: #cccccc;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
        }
        
        .upload-mode-btn.active {
            background: linear-gradient(45deg, #0066cc, #00ccff);
            color: white;
            border-color: #00ccff;
        }
        
        .upload-mode-btn:hover {
            background: rgba(0, 204, 255, 0.2);
        }
        
        .btn-download-file, .btn-delete-file, .btn-view-folder {
            padding: 0.4rem 0.8rem;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.3s ease;
            margin-left: 0.3rem;
        }
        
        .btn-download-file {
            background: linear-gradient(45deg, #0066cc, #00ccff);
            color: white;
        }
        
        .btn-view-folder {
            background: linear-gradient(45deg, #9966cc, #bb88dd);
            color: white;
        }
        
        .btn-delete-file {
            background: linear-gradient(45deg, #ff4444, #ff6666);
            color: white;
        }
        
        .btn-download-file:hover, .btn-delete-file:hover, .btn-view-folder:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        }
    `;
    document.head.appendChild(style);
});