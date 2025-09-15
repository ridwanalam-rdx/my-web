// Admin Dashboard functionality
class AdminDashboard {
    constructor() {
        this.uploadedFiles = {
            emulator: JSON.parse(localStorage.getItem('adminEmulators')) || [],
            settings: JSON.parse(localStorage.getItem('adminSettings')) || [],
            tools: JSON.parse(localStorage.getItem('adminTools')) || []
        };
        
        this.checkAdminAccess();
        this.initializeDashboard();
    }
    
    checkAdminAccess() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || currentUser.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            window.location.href = 'login.html';
            return;
        }
    }
    
    initializeDashboard() {
        this.setupFileUploads();
        this.displayUploadedFiles();
        this.updateUserInfo();
        this.updateStats();
    }
    
    setupFileUploads() {
        const uploadTypes = ['emulator', 'settings', 'tools'];
        
        uploadTypes.forEach(type => {
            const uploadArea = document.getElementById(`${type}Upload`);
            const fileInput = document.getElementById(`${type}File`);
            const folderInput = document.getElementById(`${type}Folder`);
            const uploadBtn = uploadArea?.querySelector('.btn-upload');
            
            if (uploadArea && fileInput) {
                uploadArea.addEventListener('click', () => this.triggerUpload(type));
                uploadArea.addEventListener('dragover', this.handleDragOver);
                uploadArea.addEventListener('drop', (e) => this.handleDrop(e, type));
                fileInput.addEventListener('change', (e) => this.handleFileSelect(e, type));
                folderInput?.addEventListener('change', (e) => this.handleFolderSelect(e, type));
                uploadBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.triggerUpload(type);
                });
            }
        });
    }
    
    triggerUpload(type) {
        const fileInput = document.getElementById(`${type}File`);
        const folderInput = document.getElementById(`${type}Folder`);
        const isFolder = folderInput.style.display !== 'none';
        
        if (isFolder) {
            folderInput.click();
        } else {
            fileInput.click();
        }
    }
    
    handleFolderSelect(e, type) {
        const files = Array.from(e.target.files);
        this.processFolderFiles(files, type);
    }
    
    processFolderFiles(files, type) {
        const folderStructure = {};
        
        files.forEach(file => {
            const pathParts = file.webkitRelativePath.split('/');
            const folderName = pathParts[0];
            
            if (!folderStructure[folderName]) {
                folderStructure[folderName] = [];
            }
            folderStructure[folderName].push(file);
        });
        
        Object.keys(folderStructure).forEach(folderName => {
            this.uploadFolder(folderName, folderStructure[folderName], type);
        });
    }
    
    uploadFolder(folderName, files, type) {
        const folderInfo = {
            id: Date.now() + Math.random(),
            name: folderName,
            type: 'folder',
            fileCount: files.length,
            totalSize: files.reduce((sum, file) => sum + file.size, 0),
            category: type,
            uploadDate: new Date().toISOString(),
            downloadCount: 0,
            uploadedBy: JSON.parse(localStorage.getItem('currentUser')).username,
            files: files.map(file => ({
                name: file.name,
                size: file.size,
                path: file.webkitRelativePath
            }))
        };
        
        this.showFolderUploadProgress(folderInfo);
        
        setTimeout(() => {
            this.uploadedFiles[type].push(folderInfo);
            localStorage.setItem(`admin${type.charAt(0).toUpperCase() + type.slice(1)}s`, 
                               JSON.stringify(this.uploadedFiles[type]));
            
            this.displayUploadedFiles();
            this.updateStats();
            this.showNotification(`Folder "${folderName}" uploaded successfully!`, 'success');
        }, 3000 + Math.random() * 2000);
    }
    
    showFolderUploadProgress(folderInfo) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'upload-progress';
        progressDiv.innerHTML = `
            <div class="progress-info">
                <span class="file-name">📁 ${folderInfo.name}</span>
                <span class="file-size">${folderInfo.fileCount} files - ${this.formatFileSize(folderInfo.totalSize)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <div class="progress-text">0%</div>
        `;
        
        const container = document.getElementById(`${folderInfo.category}Files`);
        container.appendChild(progressDiv);
        
        let progress = 0;
        const progressFill = progressDiv.querySelector('.progress-fill');
        const progressText = progressDiv.querySelector('.progress-text');
        
        const interval = setInterval(() => {
            progress += Math.random() * 10 + 5;
            if (progress > 100) progress = 100;
            
            progressFill.style.width = progress + '%';
            progressText.textContent = Math.round(progress) + '%';
            
            if (progress >= 100) {
                clearInterval(interval);
                setTimeout(() => progressDiv.remove(), 1000);
            }
        }, 300);
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
            emulator: ['.apk', '.exe', '.msi', '.zip', '.rar'],
            settings: ['.cfg', '.ini', '.json', '.xml', '.conf', '.txt'],
            tools: ['.exe', '.bat', '.sh', '.py', '.js', '.zip']
        };
        
        const maxSizes = {
            emulator: 1000 * 1024 * 1024, // 1GB for emulators
            settings: 50 * 1024 * 1024,   // 50MB for settings
            tools: 200 * 1024 * 1024      // 200MB for tools
        };
        
        files.forEach(file => {
            const fileExt = '.' + file.name.split('.').pop().toLowerCase();
            
            if (!validExtensions[type].includes(fileExt)) {
                this.showNotification(`Invalid file type: ${file.name}`, 'error');
                return;
            }
            
            const maxSize = maxSizes[type];
            if (file.size > maxSize) {
                const maxSizeMB = Math.round(maxSize / (1024 * 1024));
                this.showNotification(`File too large: ${file.name} (max ${maxSizeMB}MB)`, 'error');
                return;
            }
            
            this.uploadFile(file, type);
        });
    }
    
    uploadFile(file, type) {
        const fileInfo = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            category: type,
            uploadDate: new Date().toISOString(),
            downloadCount: 0,
            uploadedBy: JSON.parse(localStorage.getItem('currentUser')).username
        };
        
        this.showUploadProgress(fileInfo);
        
        setTimeout(() => {
            this.uploadedFiles[type].push(fileInfo);
            localStorage.setItem(`admin${type.charAt(0).toUpperCase() + type.slice(1)}s`, 
                               JSON.stringify(this.uploadedFiles[type]));
            
            this.displayUploadedFiles();
            this.updateStats();
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
        
        const container = document.getElementById(`${fileInfo.category}Files`);
        container.appendChild(progressDiv);
        
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
                setTimeout(() => progressDiv.remove(), 1000);
            }
        }, 200);
    }
    
    displayUploadedFiles() {
        ['emulator', 'settings', 'tools'].forEach(type => {
            const container = document.getElementById(`${type}Files`);
            if (!container) return;
            
            const existingFiles = container.querySelectorAll('.uploaded-file');
            existingFiles.forEach(file => file.remove());
            
            this.uploadedFiles[type].forEach(file => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'uploaded-file';
                
                if (file.type === 'folder') {
                    fileDiv.innerHTML = `
                        <div class="file-info">
                            <div class="file-icon">📁</div>
                            <div class="file-details">
                                <div class="file-name">${file.name}</div>
                                <div class="file-meta">
                                    ${file.fileCount} files - ${this.formatFileSize(file.totalSize)} • 
                                    ${new Date(file.uploadDate).toLocaleDateString()} • 
                                    ${file.downloadCount} downloads
                                </div>
                            </div>
                        </div>
                        <div class="file-actions">
                            <button class="btn-view-folder" onclick="adminDashboard.viewFolder('${file.id}', '${type}')">
                                View
                            </button>
                            <button class="btn-delete-file" onclick="adminDashboard.deleteFile('${file.id}', '${type}')">
                                Delete
                            </button>
                        </div>
                    `;
                } else {
                    fileDiv.innerHTML = `
                        <div class="file-info">
                            <div class="file-icon">${this.getFileIcon(file.name)}</div>
                            <div class="file-details">
                                <div class="file-name">${file.name}</div>
                                <div class="file-meta">
                                    ${this.formatFileSize(file.size)} • 
                                    ${new Date(file.uploadDate).toLocaleDateString()} • 
                                    ${file.downloadCount} downloads
                                </div>
                            </div>
                        </div>
                        <div class="file-actions">
                            <button class="btn-delete-file" onclick="adminDashboard.deleteFile('${file.id}', '${type}')">
                                Delete
                            </button>
                        </div>
                    `;
                }
                
                container.appendChild(fileDiv);
            });
        });
    }
    
    deleteFile(fileId, type) {
        if (confirm('Are you sure you want to delete this file?')) {
            this.uploadedFiles[type] = this.uploadedFiles[type].filter(f => f.id != fileId);
            localStorage.setItem(`admin${type.charAt(0).toUpperCase() + type.slice(1)}s`, 
                               JSON.stringify(this.uploadedFiles[type]));
            this.displayUploadedFiles();
            this.updateStats();
            this.showNotification('File deleted successfully!', 'success');
        }
    }
    
    updateStats() {
        const totalFiles = Object.values(this.uploadedFiles).reduce((sum, files) => sum + files.length, 0);
        const totalDownloads = Object.values(this.uploadedFiles).reduce((sum, files) => 
            sum + files.reduce((fileSum, file) => fileSum + file.downloadCount, 0), 0);
        const totalUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]').length;
        
        document.getElementById('totalFiles').textContent = totalFiles;
        document.getElementById('totalDownloads').textContent = totalDownloads;
        document.getElementById('totalUsers').textContent = totalUsers;
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
                userProfile.innerHTML = `Admin: ${currentUser.username} <span class="premium-badge">ADMIN</span>`;
            }
        }
    }
    
    viewFolder(folderId, type) {
        const folder = this.uploadedFiles[type].find(f => f.id == folderId);
        if (folder && folder.files) {
            const fileList = folder.files.map(file => 
                `${file.name} (${this.formatFileSize(file.size)})`
            ).join('\n');
            
            alert(`Folder: ${folder.name}\n\nFiles (${folder.fileCount}):\n\n${fileList}`);
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const colors = {
            success: 'rgba(0, 255, 0, 0.9)',
            error: 'rgba(255, 0, 0, 0.9)',
            info: 'rgba(0, 204, 255, 0.9)'
        };
        
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type]}</span>
            <span class="notification-text">${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed; top: 100px; right: 20px;
            background: ${colors[type]}; color: white;
            padding: 1rem 1.5rem; border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 10000; display: flex; align-items: center; gap: 0.5rem;
            animation: slideInRight 0.3s ease; backdrop-filter: blur(10px);
        `;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

function viewUsers() {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userList = users.map(user => 
        `${user.username} (${user.email}) - ${user.role} - ${new Date(user.createdAt).toLocaleDateString()}`
    ).join('\n');
    
    alert(`Registered Users:\n\n${userList || 'No users registered yet'}`);
}

// Global functions
function switchUploadMode(type, mode) {
    const fileInput = document.getElementById(`${type}File`);
    const folderInput = document.getElementById(`${type}Folder`);
    const uploadBtn = document.querySelector(`#${type}Upload .btn-upload`);
    const buttons = document.querySelectorAll(`#${type}Upload ~ .upload-options .upload-mode-btn`);
    
    // Update button states
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (mode === 'folder') {
        fileInput.style.display = 'none';
        folderInput.style.display = 'block';
        uploadBtn.textContent = 'Browse Folder';
        document.querySelector(`#${type}Upload p`).textContent = 'Upload entire folders';
    } else {
        fileInput.style.display = 'block';
        folderInput.style.display = 'none';
        uploadBtn.textContent = 'Browse Files';
        const descriptions = {
            emulator: 'Upload emulator files (APK, EXE)',
            settings: 'Upload configuration files and settings',
            tools: 'Upload optimization tools and scripts'
        };
        document.querySelector(`#${type}Upload p`).textContent = descriptions[type];
    }
}

let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});