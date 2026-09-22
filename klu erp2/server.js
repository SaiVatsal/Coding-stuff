const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const tough = require('tough-cookie');

const app = express();
const PORT = process.env.PORT || 5002; // Changed port to 5002

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create a cookie jar for session persistence
const cookieJar = new tough.CookieJar();

// Helper function to create axios instance with cookie jar via interceptors
const createAxiosInstance = () => {
  const axiosInstance = axios.create({
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    }
  });

  // Request interceptor to add cookies
  axiosInstance.interceptors.request.use((config) => {
    // Only in Node.js (not in browser)
    if (typeof window === 'undefined') {
      try {
        const url = new URL(config.baseURL + config.url);
        const cookieString = cookieJar.getCookieStringSync(url);
        if (cookieString) {
          config.headers = { ...(config.headers || {}), Cookie: cookieString };
        }
      } catch (e) {
        // If there's an error (e.g., invalid URL), we ignore and continue without cookies
        console.warn('Cookie error in request:', e.message);
      }
    }
    return config;
  });

  // Response interceptor to save cookies
  axiosInstance.interceptors.response.use((response) => {
    if (typeof window === 'undefined') {
      try {
        const url = new URL(response.config.baseURL + response.config.url);
        const setCookie = response.headers['set-cookie'];
        if (setCookie) {
          cookieJar.setCookiesSync(setCookie, url);
        }
      } catch (e) {
        console.warn('Cookie error in response:', e.message);
      }
    }
    return response;
  });

  return axiosInstance;
};

// POST /api/live-login - Handles login to KLU ERP
app.post('/api/live-login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const axiosInstance = createAxiosInstance();
    
    // Step 1: Get the login page to see if there are any hidden tokens
    const loginPageResponse = await axiosInstance.get('https://newerp.kluniversity.in');
    
    // Step 2: Prepare login data (adjust based on actual form structure)
    const loginData = new URLSearchParams();
    loginData.append('username', username);
    loginData.append('password', password);
    
    // Step 3: Submit login form
    const loginResponse = await axiosInstance.post('https://newerp.kluniversity.in/login', loginData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://newerp.kluniversity.in'
      }
    });
    
    // Check if login was successful by looking for signs of failure
    const isLoginFailed = loginResponse.data.includes('Invalid credentials') || 
                         loginResponse.data.includes('Login failed') ||
                         loginResponse.data.includes('Invalid username or password') ||
                         loginResponse.status !== 200;
    
    if (isLoginFailed) {
      return res.status(401).json({ error: 'Invalid credentials or login failed' });
    }
    
    // Step 4: Fetch dashboard to verify session and extract basic info
    const dashboardResponse = await axiosInstance.get('https://newerp.kluniversity.in/dashboard');
    const $ = cheerio.load(dashboardResponse.data);
    
    // Extract student info - adjust selectors based on actual page structure
    let studentIdBadge = '';
    let department = '';
    let academicYear = '';
    
    // Try multiple selectors for student ID
    studentIdBadge = $('span:contains("Student ID")').next().text().trim() ||
                     $('.student-id').text().trim() ||
                     $('td:contains("Student ID")').next().text().trim() ||
                     username; // fallback
    
    // Try multiple selectors for department
    department = $('span:contains("Department")').next().text().trim() ||
                 $('.dept').text().trim() ||
                 $('td:contains("Department")').next().text().trim() ||
                 'N/A';
    
    // Try multiple selectors for academic year
    academicYear = $('span:contains("Academic Year")').next().text().trim() ||
                   $('.academic-year').text().trim() ||
                   $('td:contains("Academic Year")').next().text().trim() ||
                   'N/A';
    
    res.json({
      success: true,
      message: 'Login successful',
      studentInfo: {
        studentId: studentIdBadge,
        department,
        academicYear
      }
    });
    
  } catch (error) {
    console.error('Login error:', error.message);
    
    // Handle specific errors
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Request timeout. KLU ERP server may be slow.' });
    }
    
    if (error.response && error.response.status === 401) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/live-attendance - Scrapes attendance data
app.get('/api/live-attendance', async (req, res) => {
  try {
    const axiosInstance = createAxiosInstance();
    
    // Fetch attendance page
    const attendanceResponse = await axiosInstance.get('https://newerp.kluniversity.in/attendance');
    const $ = cheerio.load(attendanceResponse.data);
    
    const attendanceData = [];
    
    // Try multiple selectors for attendance table
    $('table.attendance-table tbody tr, table.table tbody tr, tr[role="row"]').each((index, element) => {
      const cells = $(element).find('td');
      if (cells.length >= 5) {
        const subjectCode = $(cells[0]).text().trim();
        const subjectName = $(cells[1]).text().trim();
        const conducted = parseInt($(cells[2]).text().trim()) || 0;
        const attended = parseInt($(cells[3]).text().trim()) || 0;
        const percentage = conducted > 0 ? ((attended / conducted) * 100).toFixed(2) : '0.00';
        const status = $(cells[4]).text().trim();
        
        attendanceData.push({
          subjectCode,
          subjectName,
          conducted,
          attended,
          percentage: parseFloat(percentage),
          status
        });
      }
    });
    
    // If no data found with the above selectors, try alternative table structure
    if (attendanceData.length === 0) {
      $('table tr').each((index, element) => {
        const cells = $(element).find('td');
        if (cells.length >= 5) {
          const text0 = $(cells[0]).text().trim();
          // Skip header rows
          if (text0 && !text0.toLowerCase().includes('subject') && !text0.toLowerCase().includes('code')) {
            const subjectCode = text0;
            const subjectName = $(cells[1]).text().trim();
            const conducted = parseInt($(cells[2]).text().trim()) || 0;
            const attended = parseInt($(cells[3]).text().trim()) || 0;
            const percentage = conducted > 0 ? ((attended / conducted) * 100).toFixed(2) : '0.00';
            const status = $(cells[4]).text().trim();
            
            attendanceData.push({
              subjectCode,
              subjectName,
              conducted,
              attended,
              percentage: parseFloat(percentage),
              status
            });
          }
        }
      });
    }
    
    res.json(attendanceData);
    
  } catch (error) {
    console.error('Attendance scrape error:', error.message);
    res.status(500).json({ error: 'Failed to scrape attendance data' });
  }
});

// GET /api/live-cgpa - Scrapes CGPA data
app.get('/api/live-cgpa', async (req, res) => {
  try {
    const axiosInstance = createAxiosInstance();
    
    // Fetch CGPA/grades page
    const cgpaResponse = await axiosInstance.get('https://newerp.kluniversity.in/cgpa');
    const $ = cheerio.load(cgpaResponse.data);
    
    // Extract cumulative CGPA
    let cumulativeCgpa = 0.00;
    const cgpaElement = $('span.cumulative-cgpa, div.cgpa-value, .cgpa, td:contains("CGPA") + td, td:contains("Cumulative") + td');
    if (cgpaElement.length) {
      const text = cgpaElement.first().text().trim();
      const parsed = parseFloat(text);
      if (!isNaN(parsed)) {
        cumulativeCgpa = parsed;
      }
    }
    
    // Extract semester-wise data
    const semesterData = [];
    $('table.cgpa-table tbody tr, table.table tbody tr').each((index, element) => {
      const cells = $(element).find('td');
      if (cells.length >= 3) {
        const semester = $(cells[0]).text().trim();
        const sgpaText = $(cells[1]).text().trim();
        const creditsText = $(cells[2]).text().trim();
        
        const sgpa = parseFloat(sgpaText) || 0.00;
        const credits = parseInt(creditsText) || 0;
        
        // Skip header rows
        if (semester.toLowerCase().includes('semester') || semester.toLowerCase().includes('sem')) {
          semesterData.push({
            semester,
            sgpa,
            credits
          });
        }
      }
    });
    
    // If no semester data found with specific selectors, try a more general approach
    if (semesterData.length === 0) {
      $('table tr').each((index, element) => {
        const cells = $(element).find('td');
        if (cells.length >= 3) {
          const semester = $(cells[0]).text().trim();
          const sgpa = parseFloat($(cells[1]).text().trim()) || 0.00;
          const credits = parseInt($(cells[2]).text().trim()) || 0;
          
          // Skip if it looks like a header
          if (semester && !semester.toLowerCase().includes('semester') && !semester.toLowerCase().includes('sgpa') && !semester.toLowerCase().includes('credits')) {
            semesterData.push({
              semester,
              sgpa,
              credits
            });
          }
        }
      });
    }
    
    res.json({
      cumulativeCgpa: parseFloat(cumulativeCgpa.toFixed(2)),
      semesterData
    });
    
  } catch (error) {
    console.error('CGPA scrape error:', error.message);
    res.status(500).json({ error: 'Failed to scrape CGPA data' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`KLU ERP Proxy Server running on http://localhost:${PORT}`);
});

module.exports = app;