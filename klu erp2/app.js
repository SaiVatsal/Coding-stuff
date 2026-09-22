document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const app = document.getElementById('app');
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const captchaCanvas = document.getElementById('captcha-canvas');
    const refreshCaptchaBtn = document.getElementById('refresh-captcha');
    const errorMessage = document.getElementById('error-message');
    const loadingOverlay = document.getElementById('loading-overlay');
    const logoutBtn = document.getElementById('logout-btn');
    const profileHeader = document.getElementById('profile-header');
    const studentIdSpan = document.getElementById('student-id');
    const studentDeptSpan = document.getElementById('student-dept');
    const studentYearSpan = document.getElementById('student-year');
    const attendanceTableBody = document.querySelector('#attendance-table tbody');
    const cgpaValue = document.getElementById('cgpa-value');
    const semesterBreakdown = document.getElementById('semester-breakdown');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // State
    let currentStudentId = '';
    let currentStudentDept = '';
    let currentStudentYear = '';
    let captchaText = '';
    
    // Initialize
    function init() {
        showView('login-view');
        generateCaptcha();
        setupEventListeners();
        initTiltEffect();
    }
    
    // Show/hide views
    function showView(viewId) {
        loginView.classList.remove('active');
        dashboardView.classList.remove('active');
        document.getElementById(viewId).classList.add('active');
    }
    
    // Event listeners
    function setupEventListeners() {
        loginForm.addEventListener('submit', handleLogin);
        refreshCaptchaBtn.addEventListener('click', generateCaptcha);
        logoutBtn.addEventListener('click', handleLogout);
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                const sectionId = item.dataset.section + '-section';
                contentSections.forEach(section => section.classList.remove('active'));
                document.getElementById(sectionId).classList.add('active');
            });
        });
    }
    
    // Generate simple CAPTCHA
    function generateCaptcha() {
        const ctx = captchaCanvas.getContext('2d');
        ctx.clearRect(0, 0, captchaCanvas.width, captchaCanvas.height);
        
        // Generate random text
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let captcha = '';
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        captchaText = captcha;
        
        // Draw background
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, 0, captchaCanvas.width, captchaCanvas.height);
        
        // Draw border
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, captchaCanvas.width-1, captchaCanvas.height-1);
        
        // Draw text
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        
        // Add some distortion
        for (let i = 0; i < captcha.length; i++) {
            const x = 40 + i * 25 + Math.random() * 8 - 4;
            const y = 30 + Math.random() * 10 - 5;
            const rotate = Math.random() * 0.4 - 0.2;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotate);
            ctx.fillText(captcha[i], 0, 0);
            ctx.restore();
        }
        
        // Add noise
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * captchaCanvas.width;
            const y = Math.random() * captchaCanvas.height;
            const radius = Math.random() * 1.5;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
            ctx.fill();
        }
    }
    
    // Handle login
    async function handleLogin(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        const captchaInput = document.getElementById('captcha-input').value.trim().toUpperCase();
        
        // Validate CAPTCHA
        if (captchaInput !== captchaText) {
            errorMessage.textContent = 'Invalid CAPTCHA. Please try again.';
            errorMessage.style.display = 'block';
            generateCaptcha();
            return;
        }
        
        // Show loading
        loadingOverlay.style.display = 'flex';
        errorMessage.style.display = 'none';
        
        try {
            // Call login API
            const response = await fetch('/api/live-login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }
            
            // Store user info
            currentStudentId = data.studentId || username;
            currentStudentDept = data.department || '';
            currentStudentYear = data.academicYear || '';
            
            // Update profile header
            studentIdSpan.textContent = `Student ID: ${currentStudentId}`;
            studentDeptSpan.textContent = `Department: ${currentStudentDept}`;
            studentYearSpan.textContent = `Academic Year: ${currentStudentYear}`;
            
            // Show dashboard
            showView('dashboard-view');
            
            // Fetch initial data
            await fetchAttendance();
            await fetchCGPA();
            
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }
    
    // Handle logout
    function handleLogout() {
        // Clear form
        loginForm.reset();
        errorMessage.style.display = 'none';
        generateCaptcha();
        
        // Show login view
        showView('login-view');
        
        // Clear dashboard data
        attendanceTableBody.innerHTML = '';
        cgpaValue.textContent = '0.00';
        semesterBreakdown.innerHTML = '';
        
        // Reset active nav item
        navItems.forEach(item => item.classList.remove('active'));
        document.querySelector('.nav-item[data-section="home"]').classList.add('active');
        contentSections.forEach(section => section.classList.remove('active'));
        document.getElementById('home-section').classList.add('active');
    }
    
    // Fetch attendance data
    async function fetchAttendance() {
        try {
            const response = await fetch('/api/live-attendance');
            if (!response.ok) throw new Error('Failed to fetch attendance');
            
            const attendanceData = await response.json();
            renderAttendanceTable(attendanceData);
        } catch (error) {
            console.error('Attendance fetch error:', error);
            // Show error in UI? For now just log
        }
    }
    
    // Fetch CGPA data
    async function fetchCGPA() {
        try {
            const response = await fetch('/api/live-cgpa');
            if (!response.ok) throw new Error('Failed to fetch CGPA');
            
            const cgpaData = await response.json();
            renderCGPA(cgpaData);
        } catch (error) {
            console.error('CGPA fetch error:', error);
        }
    }
    
    // Render attendance table
    function renderAttendanceTable(data) {
        attendanceTableBody.innerHTML = '';
        
        if (!data || data.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" class="text-center">No attendance data available</td>`;
            attendanceTableBody.appendChild(row);
            return;
        }
        
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.subjectCode || '-'}</td>
                <td>${item.subjectName || '-'}</td>
                <td>${item.conducted || 0}</td>
                <td>${item.attended || 0}</td>
                <td>${item.percentage || 0}%</td>
                <td><span class="status-badge ${item.status.toLowerCase().includes('pass') ? 'status-pass' : 'status-fail'}">${item.status || '-'}</span></td>
            `;
            attendanceTableBody.appendChild(row);
        });
    }
    
    // Render CGPA data
    function renderCGPA(data) {
        if (data.cgpa !== undefined) {
            cgpaValue.textContent = data.cgpa.toFixed(2);
        }
        
        // Render semester breakdown
        semesterBreakdown.innerHTML = '';
        if (data.semesters && Array.isArray(data.semesters)) {
            data.semesters.forEach(sem => {
                const semItem = document.createElement('div');
                semItem.className = 'semester-item';
                semItem.innerHTML = `
                    <span>Semester ${sem.semester}</span>
                    <span>${sem.sgpa !== undefined ? sem.sgpa.toFixed(2) : '-'}</span>
                `;
                semesterBreakdown.appendChild(semItem);
            });
        }
    }
    
    // Initialize 3D tilt effect on cards
    function initTiltEffect() {
        const cards = document.querySelectorAll('.glass-card');
        
        cards.forEach(card => {
            card.addEventListener('mousemove', e => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / centerY * 10; // Max 10deg tilt
                const rotateY = (centerX - x) / centerX * 10; // Invert X for natural movement
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            });
        });
    }
    
    // Initialize app
    init();
});