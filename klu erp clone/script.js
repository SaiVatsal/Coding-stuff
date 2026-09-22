// State variables
let currentCaptcha = "";

// Generate Anti-SQL-Injection / Anti-Bot Canvas CAPTCHA
function generateCaptcha() {
    const canvas = document.getElementById("captchaCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background fill
    ctx.fillStyle = "#161f33";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Random noise lines (prevents automated OCR scraping)
    for (let i = 0; i < 6; i++) {
        ctx.strokeStyle = `rgba(${Math.random()*255}, ${Math.random()*255}, 255, 0.3)`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
    }
    
    // Generate Random 6-character Code
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    currentCaptcha = "";
    ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
    
    for (let i = 0; i < 5; i++) {
        const char = chars.charAt(Math.floor(Math.random() * chars.length));
        currentCaptcha += char;
        
        ctx.fillStyle = i % 2 === 0 ? "#06b6d4" : "#3b82f6";
        ctx.save();
        ctx.translate(25 + i * 28, 30);
        ctx.rotate((Math.random() - 0.5) * 0.4); // Random character tilt
        ctx.fillText(char, 0, 0);
        ctx.restore();
    }
}

// Handle Login Submission
function handleLogin(event) {
    event.preventDefault();
    
    const user = document.getElementById("username").value.trim();
    const pass = document.getElementById("password").value.trim();
    const captchaVal = document.getElementById("captchaInput").value.trim().toUpperCase();
    const errorDiv = document.getElementById("login-error");

    // Captcha Validation
    if (captchaVal !== currentCaptcha) {
        errorDiv.textContent = "Invalid CAPTCHA code. Please try again.";
        generateCaptcha();
        return;
    }

    // Input sanitization/validation simulation
    if (user === "" || pass === "") {
        errorDiv.textContent = "Please fill in all security fields.";
        return;
    }

    errorDiv.textContent = "";

    // Smooth Screen Transition to Dashboard
    const loginScreen = document.getElementById("login-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");

    loginScreen.classList.remove("active");
    
    setTimeout(() => {
        dashboardScreen.classList.add("active");
    }, 300);
}

// Handle Logout
function handleLogout() {
    const loginScreen = document.getElementById("login-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");

    dashboardScreen.classList.remove("active");
    setTimeout(() => {
        loginScreen.classList.add("active");
        generateCaptcha();
        document.getElementById("login-form").reset();
    }, 300);
}

// Dynamic Interactive 3D Card Tilt Effect
function init3DTiltEffect() {
    const cards = document.querySelectorAll(".3d-card, .login-card");

    cards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -10;
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
        });
    });
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    generateCaptcha();
    init3DTiltEffect();
});