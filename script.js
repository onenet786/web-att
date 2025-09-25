// Employee Management System JavaScript with MySQL Integration

// Check authentication status
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        window.location.href = 'login.html';
        return;
    }
    
    // Set up user info in UI
    setupUserInfo(user);
    
    // Apply role-based access control
    applyRoleBasedAccess(user.role);
}

function setupUserInfo(user) {
    // Add user info to the header if the element exists
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
        userInfoElement.innerHTML = `
            <div class="user-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div>
                <span>${user.username}</span>
                <button class="btn logout-btn" onclick="logout()">Logout</button>
            </div>
        `;
    }
}

function applyRoleBasedAccess(role) {
    if (role === 'user') {
        // Redirect regular users to attendance page
        if (window.location.pathname.includes('index.html')) {
            window.location.href = 'attendance.html';
        }
    }
    
    // Hide elements based on role
    document.querySelectorAll('[data-role]').forEach(element => {
        const allowedRoles = element.dataset.role.split(',');
        if (!allowedRoles.includes(role) && !allowedRoles.includes('all')) {
            element.style.display = 'none';
        }
    });
}

function logout() {
    fetch('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    }).finally(() => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });
}

// Global variables
let employees = [];
let workRecords = {}

// Report Type Functions
function showReportType(type) {
    // Update button states
    document.querySelectorAll('.report-type-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide report sections
    const individualSection = document.getElementById('individualReportSection');
    const totalSection = document.getElementById('totalReportSection');
    const dailySection = document.getElementById('dailyReportSection');
    const reportContent = document.getElementById('reportContent');
    
    if (type === 'individual') {
        individualSection.style.display = 'block';
        totalSection.style.display = 'none';
        dailySection.style.display = 'none';
        // Reset to individual report view
        generateReport();
    } else if (type === 'total') {
        individualSection.style.display = 'none';
        totalSection.style.display = 'block';
        dailySection.style.display = 'none';
        // Set default month and generate total report
        const totalMonthInput = document.getElementById('totalReportMonth');
        if (!totalMonthInput.value) {
            const now = new Date();
            totalMonthInput.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
        }
        generateTotalReport();
    } else if (type === 'daily') {
        individualSection.style.display = 'none';
        totalSection.style.display = 'none';
        dailySection.style.display = 'block';
        // Set default date and generate daily report
        const dailyDateInput = document.getElementById('dailyReportDate');
        if (!dailyDateInput.value) {
            const now = new Date();
            dailyDateInput.value = now.toISOString().split('T')[0];
        }
        generateDailyReport();
    }
}

// Daily Attendance Report Functions
async function generateDailyReport() {
    const dateInput = document.getElementById('dailyReportDate');
    const reportContent = document.getElementById('reportContent');
    
    if (!dateInput.value) {
        reportContent.innerHTML = '<p class="text-center text-muted">Please select a date to generate the daily attendance report.</p>';
        return;
    }

    try {
        const reportData = await apiCall(`/reports/daily/${dateInput.value}`);
        
        // Generate report HTML
        let reportHTML = `
            <div class="report-header">
                <h3>Daily Attendance Report - ${formatDate(reportData.date)}</h3>
            </div>
            
            <div class="report-stats">
                <div class="stat-card">
                    <div class="stat-number">${reportData.summary.totalEmployees}</div>
                    <div class="stat-label">Total Employees</div>
                </div>
                <div class="stat-card present">
                    <div class="stat-number">${reportData.summary.present}</div>
                    <div class="stat-label">Present</div>
                </div>
                <div class="stat-card absent">
                    <div class="stat-number">${reportData.summary.absent}</div>
                    <div class="stat-label">Absent</div>
                </div>
                <div class="stat-card late">
                    <div class="stat-number">${reportData.summary.late}</div>
                    <div class="stat-label">Late</div>
                </div>
                <div class="stat-card sick-leave">
                    <div class="stat-number">${reportData.summary.sickLeave}</div>
                    <div class="stat-label">Sick Leave</div>
                </div>
                <div class="stat-card vacation">
                    <div class="stat-number">${reportData.summary.vacation}</div>
                    <div class="stat-label">Vacation</div>
                </div>
                <div class="stat-card attendance-rate">
                    <div class="stat-number">${reportData.summary.attendanceRate}%</div>
                    <div class="stat-label">Attendance Rate</div>
                </div>
            </div>
            
            <div class="daily-report-table">
                <h4>Employee Details</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Position</th>
                            <th>Status</th>
                            <th>Check In</th>
                            <th>Check Out</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Add employee rows
        reportData.employees.forEach(employee => {
            const statusClass = employee.status.replace('_', '-');
            const checkIn = employee.check_in_time ? new Date(`2000-01-01T${employee.check_in_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';
            const checkOut = employee.check_out_time ? new Date(`2000-01-01T${employee.check_out_time}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';
            
            reportHTML += `
                <tr>
                    <td>${employee.employee_id}</td>
                    <td>${employee.name}</td>
                    <td>${employee.department}</td>
                    <td>${employee.position}</td>
                    <td><span class="status-badge ${statusClass}">${employee.status.replace('_', ' ').toUpperCase()}</span></td>
                    <td>${checkIn}</td>
                    <td>${checkOut}</td>
                    <td>${employee.notes || '-'}</td>
                </tr>
            `;
        });
        
        reportHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        reportContent.innerHTML = reportHTML;
        
    } catch (error) {
        console.error('Error generating daily report:', error);
        reportContent.innerHTML = '<p class="text-center text-danger">Error loading daily report. Please try again.</p>';
    }
}

async function exportDailyReport() {
    const dateInput = document.getElementById('dailyReportDate');
    const formatSelect = document.getElementById('dailyExportFormat');
    
    if (!dateInput.value) {
        showMessage('Please select a date first', 'error');
        return;
    }
    
    try {
        const response = await apiCall(`/reports/daily/${dateInput.value}`);
        const reportData = await response.json();
        
        if (formatSelect.value === 'csv') {
            exportDailyToCSV(reportData);
        } else if (formatSelect.value === 'pdf') {
            exportDailyToPDF(reportData);
        }
        
        showMessage('Report exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting daily report:', error);
        showMessage('Error exporting report. Please try again.', 'error');
    }
}

function exportDailyToCSV(reportData) {
    const csvContent = [
        ['Daily Attendance Report - ' + formatDate(reportData.date)],
        [''],
        ['Summary'],
        ['Total Employees', reportData.summary.totalEmployees],
        ['Present', reportData.summary.present],
        ['Absent', reportData.summary.absent],
        ['Late', reportData.summary.late],
        ['Sick Leave', reportData.summary.sickLeave],
        ['Vacation', reportData.summary.vacation],
        ['Attendance Rate', reportData.summary.attendanceRate + '%'],
        [''],
        ['Employee Details'],
        ['Employee ID', 'Name', 'Department', 'Position', 'Status', 'Check In', 'Check Out', 'Notes'],
        ...reportData.employees.map(emp => [
            emp.employee_id,
            emp.name,
            emp.department,
            emp.position,
            emp.status.replace('_', ' ').toUpperCase(),
            emp.check_in_time || '-',
            emp.check_out_time || '-',
            emp.notes || '-'
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily_attendance_report_${reportData.date}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportDailyToPDF(reportData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Daily Attendance Report', 20, 20);
    doc.setFontSize(14);
    doc.text(formatDate(reportData.date), 20, 30);
    
    // Summary
    doc.setFontSize(12);
    doc.text('Summary:', 20, 50);
    let yPos = 60;
    
    const summaryData = [
        ['Total Employees:', reportData.summary.totalEmployees],
        ['Present:', reportData.summary.present],
        ['Absent:', reportData.summary.absent],
        ['Late:', reportData.summary.late],
        ['Sick Leave:', reportData.summary.sickLeave],
        ['Vacation:', reportData.summary.vacation],
        ['Attendance Rate:', reportData.summary.attendanceRate + '%']
    ];
    
    summaryData.forEach(([label, value]) => {
        doc.text(label, 20, yPos);
        doc.text(String(value), 80, yPos);
        yPos += 8;
    });
    
    // Employee table
    yPos += 10;
    doc.text('Employee Details:', 20, yPos);
    yPos += 10;
    
    const tableData = reportData.employees.map(emp => [
        emp.employee_id,
        emp.name,
        emp.department,
        emp.status.replace('_', ' ').toUpperCase(),
        emp.check_in_time || '-',
        emp.check_out_time || '-'
    ]);
    
    doc.autoTable({
        head: [['ID', 'Name', 'Department', 'Status', 'Check In', 'Check Out']],
        body: tableData,
        startY: yPos,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    });
    
    doc.save(`daily_attendance_report_${reportData.date}.pdf`);
}

// Total Employee Report Functions
async function generateTotalReport() {
    const monthInput = document.getElementById('totalReportMonth');
    const reportContent = document.getElementById('reportContent');
    
    // Set default month to current month
    if (!monthInput.value) {
        const now = new Date();
        monthInput.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    }
    
    const selectedMonth = monthInput.value;
    
    if (!selectedMonth) {
        reportContent.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><h3>Select a month</h3><p>Choose a month to generate total employee report.</p></div>';
        return;
    }
    
    try {
        const reportData = await apiCall(`/reports/total/${selectedMonth}`);
        
        const year = parseInt(selectedMonth.split('-')[0]);
        const month = parseInt(selectedMonth.split('-')[1]);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        reportContent.innerHTML = `
            <div class="report-header">
                <h3>Total Employee Report</h3>
                <p>Month: ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            
            <!-- Statistics section with Total Employees visible, others hidden -->
            <div class="report-stats">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${reportData.totalEmployees}</h3>
                        <p>Total Employees</p>
                    </div>
                </div>
                <div class="stat-card" style="display: none;">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${reportData.totalPresentDays || 0}</h3>
                        <p>Total Present Days</p>
                    </div>
                </div>
                <div class="stat-card" style="display: none;">
                    <div class="stat-icon absent">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${reportData.totalAbsentDays || 0}</h3>
                        <p>Total Absent Days</p>
                    </div>
                </div>
                <div class="stat-card" style="display: none;">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${reportData.averageAttendanceRate || 0}%</h3>
                        <p>Average Attendance Rate</p>
                    </div>
                </div>
            </div>
            
            <!-- Search functionality -->
            <div class="search-section">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="employeeSearch" placeholder="Search by name or employee ID..." onkeyup="searchTotalReportEmployees()">
                </div>
            </div>
            
            <div class="employee-summary-table">
                <h4>Employee Summary</h4>
                <table class="summary-table">
                    <thead>
                        <tr>
                            <th>Employee ID</th>
                            <th>Name</th>
                            <th>Present Days</th>
                            <th>Absent Days</th>
                            <th>Attendance Rate</th>
                        </tr>
                    </thead>
                    <tbody id="employeeSummaryBody">
                        ${reportData.employeeSummary.map(emp => `
                            <tr class="employee-row" onclick="showEmployeeDetailReport('${emp.employee_id}', '${selectedMonth}')" style="cursor: pointer;">
                                <td>${emp.employee_id}</td>
                                <td>${emp.name}</td>
                                <td class="present-count">${emp.presentDays}</td>
                                <td class="absent-count">${emp.absentDays}</td>
                                <td class="attendance-rate">${emp.attendanceRate}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <!-- Individual employee report section (initially hidden) -->
            <div id="individualEmployeeReport" style="display: none; margin-top: 30px;">
                <div class="report-header">
                    <h4 id="individualReportTitle">Employee Detail Report</h4>
                    <button class="btn btn-secondary" onclick="hideIndividualReport()">
                        <i class="fas fa-arrow-left"></i> Back to Summary
                    </button>
                </div>
                <div id="individualReportContent"></div>
            </div>
        `;
        
        // Store report data for search functionality
        window.currentTotalReportData = reportData;
        
    } catch (error) {
        console.error('Error generating total report:', error);
        reportContent.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading report</h3><p>Failed to load total employee report. Please try again.</p></div>';
    }
}

async function exportTotalReport() {
    const monthInput = document.getElementById('totalReportMonth');
    const formatSelect = document.getElementById('totalExportFormat');
    
    const selectedMonth = monthInput.value;
    const format = formatSelect.value;
    
    if (!selectedMonth) {
        showMessage('Please select a month first', 'error');
        return;
    }
    
    try {
        const reportData = await apiCall(`/reports/total/${selectedMonth}`);
        
        if (format === 'csv') {
            exportTotalToCSV(reportData, selectedMonth);
        } else if (format === 'pdf') {
            exportTotalToPDF(reportData, selectedMonth);
        }
        
        showMessage('Total report exported successfully!', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showMessage('Failed to export total report', 'error');
    }
}

function exportTotalToCSV(reportData, selectedMonth) {
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    let csvContent = `Total Employee Report - ${monthName}\n\n`;
    csvContent += `Total Employees,${reportData.totalEmployees}\n`;
    csvContent += `Total Present Days,${reportData.totalPresentDays}\n`;
    csvContent += `Total Absent Days,${reportData.totalAbsentDays}\n`;
    csvContent += `Average Attendance Rate,${reportData.averageAttendanceRate}%\n\n`;
    
    csvContent += 'Employee ID,Name,Present Days,Absent Days,Attendance Rate\n';
    reportData.employeeSummary.forEach(emp => {
        csvContent += `${emp.employee_id},${emp.name},${emp.presentDays},${emp.absentDays},${emp.attendanceRate}%\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `total_employee_report_${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

function exportTotalToPDF(reportData, selectedMonth) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Header
    doc.setFontSize(20);
    doc.text('Total Employee Report', 20, 30);
    doc.setFontSize(14);
    doc.text(`Month: ${monthName}`, 20, 45);
    
    // Summary stats
    doc.setFontSize(12);
    doc.text(`Total Employees: ${reportData.totalEmployees}`, 20, 65);
    doc.text(`Total Present Days: ${reportData.totalPresentDays}`, 20, 75);
    doc.text(`Total Absent Days: ${reportData.totalAbsentDays}`, 20, 85);
    doc.text(`Average Attendance Rate: ${reportData.averageAttendanceRate}%`, 20, 95);
    
    // Employee table header
    doc.text('Employee Summary:', 20, 115);
    doc.text('ID', 20, 130);
    doc.text('Name', 50, 130);
    doc.text('Present', 110, 130);
    doc.text('Absent', 140, 130);
    doc.text('Rate', 170, 130);
    
    // Employee data
    let yPos = 145;
    reportData.employeeSummary.forEach(emp => {
        if (yPos > 270) {
            doc.addPage();
            yPos = 30;
        }
        doc.text(emp.employee_id, 20, yPos);
        doc.text(emp.name.substring(0, 20), 50, yPos);
        doc.text(emp.presentDays.toString(), 110, yPos);
        doc.text(emp.absentDays.toString(), 140, yPos);
        doc.text(`${emp.attendanceRate}%`, 170, yPos);
        yPos += 15;
    });
    
    doc.save(`total_employee_report_${selectedMonth}.pdf`);
};
let currentDate = new Date().toISOString().split('T')[0];
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    initializeApp();
    await loadEmployees();
    await updateDashboard();
    await loadWorkRecordsForDate();
    loadEmployeesList();
    generateReport();
});

// API Helper Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'API request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showMessage(`API Error: ${error.message}`, 'error');
        throw error;
    }
}

// Data Management Functions
async function loadEmployees() {
    try {
        employees = await apiCall('/employees');
    } catch (error) {
        console.error('Failed to load employees:', error);
        employees = [];
    }
}


// Navigation Functions
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all nav tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => tab.classList.remove('active'));

    // Show selected tab content
    document.getElementById(tabName).classList.add('active');

    // Add active class to clicked nav tab
    event.target.classList.add('active');

    // Update content based on tab
    switch(tabName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'work-records':
            loadWorkRecordsForDate();
            break;
        case 'employees':
            loadEmployeesList();
            break;
        case 'reports':
            // Just populate the dropdown, don't generate report yet
            const employeeSelect = document.getElementById('reportEmployee');
            if (employeeSelect && employeeSelect.children.length <= 1) {
                employeeSelect.innerHTML = '<option value="">Select Employee</option>' +
                    employees.map(employee => `<option value="${employee.employee_id}">${employee.name} (${employee.employee_id})</option>`).join('');
            }
            // Set default month
            const monthInput = document.getElementById('reportMonth');
            if (monthInput && !monthInput.value) {
                const now = new Date();
                monthInput.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
            }
            // Show initial message
            const reportContent = document.getElementById('reportContent');
            if (reportContent) {
                reportContent.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><h3>Select an employee and month</h3><p>Choose an employee and month to generate work records report.</p></div>';
            }
            break;
    }
}

// Dashboard Functions
async function updateDashboard() {
    try {
        const dashboardData = await apiCall('/dashboard');
        
        // Update dashboard stats
        document.getElementById('totalEmployees').textContent = dashboardData.totalEmployees;
        document.getElementById('presentToday').textContent = dashboardData.todayWorkRecords.present || 0;
        
        // Calculate absent as total employees minus present employees
        const totalEmployees = dashboardData.totalEmployees;
        const presentToday = dashboardData.todayWorkRecords.present || 0;
        const absentToday = totalEmployees - presentToday;
        document.getElementById('absentToday').textContent = absentToday;
        
        const attendanceRate = totalEmployees > 0 ? 
            Math.round((presentToday / totalEmployees) * 100) : 0;
        document.getElementById('attendanceRate').textContent = attendanceRate + '%';

        // Update recent activity
        updateRecentActivity(dashboardData.recentActivities);
    } catch (error) {
        console.error('Failed to update dashboard:', error);
        // Fallback to local data
        const totalEmployees = employees.length;
        const today = new Date().toISOString().split('T')[0];
        const todayWorkRecords = workRecords[today] || {};
        
        let presentCount = 0;
        
        employees.forEach(employee => {
            const employeeWorkRecord = todayWorkRecords[employee.employee_id];
            if (employeeWorkRecord === 'present') {
                presentCount++;
            }
        });

        const absentCount = totalEmployees - presentCount;
        const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

        document.getElementById('totalEmployees').textContent = totalEmployees;
        document.getElementById('presentToday').textContent = presentCount;
        document.getElementById('absentToday').textContent = absentCount;
        document.getElementById('attendanceRate').textContent = attendanceRate + '%';
    }
}

function updateRecentActivity(recentActivities = []) {
    const activityList = document.getElementById('recentActivity');
    const activities = [];

    // Add recent work record activities from API
    recentActivities.forEach(activity => {
        activities.push({
            type: 'work_record',
            date: activity.date,
            message: `${activity.count} work records on ${formatDate(activity.date)}`,
            icon: 'fas fa-calendar-check'
        });
    });

    // Get recent employee additions from local data
    const recentEmployees = employees
        .sort((a, b) => new Date(b.date_added) - new Date(a.date_added))
        .slice(0, 3);
    
    recentEmployees.forEach(employee => {
        activities.push({
            type: 'employee',
            date: employee.date_added,
            message: `New employee added: ${employee.name}`,
            icon: 'fas fa-user-plus'
        });
    });

    // Sort activities by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Display activities
    if (activities.length === 0) {
        activityList.innerHTML = '<div class="empty-state"><i class="fas fa-info-circle"></i><h3>No recent activity</h3><p>Start by adding employees and marking work records.</p></div>';
    } else {
        activityList.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <i class="${activity.icon}"></i>
                <span>${activity.message}</span>
            </div>
        `).join('');
    }
}

// Employee Management Functions
function showAddEmployeeModal() {
    document.getElementById('addEmployeeModal').style.display = 'block';
    document.getElementById('addEmployeeForm').reset();
    loadDepartments();
    loadPositions();
    generateEmployeeId();
}

function closeAddEmployeeModal() {
    document.getElementById('addEmployeeModal').style.display = 'none';
}

function showEditEmployeeModal(index) {
    const employee = employees[index];
    document.getElementById('editEmployeeIndex').value = index;
    document.getElementById('editEmployeeName').value = employee.name;
    document.getElementById('editEmployeeId').value = employee.employee_id;
    document.getElementById('editEmployeeEmail').value = employee.email;
    document.getElementById('editEmployeePhone').value = employee.phone || '';
    document.getElementById('editEmployeeCNIC').value = employee.cnic || '';
    document.getElementById('editEmployeeSalary').value = employee.salary || '';
    document.getElementById('editEmployeeJoiningDate').value = employee.hire_date || '';
    document.getElementById('editEmployeeFatherName').value = employee.father_name || '';
    document.getElementById('editEmployeeEducation').value = employee.education || '';
    document.getElementById('editEmployeeDOB').value = employee.date_of_birth || '';
    document.getElementById('editEmployeeAddress').value = employee.address || '';
    document.getElementById('editEmployeeReference').value = employee.reference || '';
    
    // Set dropdown values
    document.getElementById('editEmployeeDepartment').value = employee.department;
    document.getElementById('editEmployeePosition').value = employee.position;
    
    // Handle picture display
    const editPicturePreview = document.getElementById('editPicturePreview');
    const editPreviewImage = document.getElementById('editPreviewImage');
    const clearEditPictureBtn = document.getElementById('clearEditPictureBtn');
    
    if (employee.picture) {
        editPreviewImage.src = employee.picture;
        editPicturePreview.style.display = 'block';
        clearEditPictureBtn.style.display = 'inline-block';
        selectedPictureData = employee.picture; // Set current picture as selected
    } else {
        editPicturePreview.style.display = 'none';
        clearEditPictureBtn.style.display = 'none';
        selectedPictureData = null;
    }
    
    loadDepartments();
    loadPositions();
    
    document.getElementById('editEmployeeModal').style.display = 'block';
}

function closeEditEmployeeModal() {
    document.getElementById('editEmployeeModal').style.display = 'none';
    
    // Clear picture data when closing edit modal
    selectedPictureData = null;
    clearEditPicture();
}

// Load departments for dropdown
async function loadDepartments() {
    try {
        const departments = await apiCall('/departments');
        const addSelect = document.getElementById('employeeDepartment');
        const editSelect = document.getElementById('editEmployeeDepartment');
        
        // Clear existing options
        addSelect.innerHTML = '<option value="">Select Department</option>';
        editSelect.innerHTML = '<option value="">Select Department</option>';
        
        departments.forEach(dept => {
            const option1 = new Option(dept.name, dept.name);
            const option2 = new Option(dept.name, dept.name);
            addSelect.appendChild(option1);
            editSelect.appendChild(option2);
        });
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

// Load positions for dropdown
async function loadPositions() {
    try {
        const positions = await apiCall('/positions');
        const addSelect = document.getElementById('employeePosition');
        const editSelect = document.getElementById('editEmployeePosition');
        
        // Clear existing options
        addSelect.innerHTML = '<option value="">Select Position</option>';
        editSelect.innerHTML = '<option value="">Select Position</option>';
        
        positions.forEach(pos => {
            const option1 = new Option(pos.title, pos.title);
            const option2 = new Option(pos.title, pos.title);
            addSelect.appendChild(option1);
            editSelect.appendChild(option2);
        });
    } catch (error) {
        console.error('Error loading positions:', error);
    }
}

// CNIC formatting and validation functions
function formatCNIC(input) {
    let value = input.value.replace(/\D/g, ''); // Remove non-digits
    
    if (value.length <= 5) {
        input.value = value;
    } else if (value.length <= 12) {
        input.value = value.slice(0, 5) + '-' + value.slice(5);
    } else {
        input.value = value.slice(0, 5) + '-' + value.slice(5, 12) + '-' + value.slice(12, 13);
    }
}

function validateCNICField(input) {
    const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
    const errorElement = document.getElementById(input.id + 'Error');
    
    if (input.value && !cnicPattern.test(input.value)) {
        errorElement.style.display = 'block';
        input.style.borderColor = 'red';
        return false;
    } else {
        errorElement.style.display = 'none';
        input.style.borderColor = '';
        return true;
    }
}

// Add department and position management functions
function showAddDepartmentModal() {
    document.getElementById('addDepartmentModal').style.display = 'block';
    document.getElementById('addDepartmentForm').reset();
}

function closeAddDepartmentModal() {
    document.getElementById('addDepartmentModal').style.display = 'none';
}

function showAddPositionModal() {
    document.getElementById('addPositionModal').style.display = 'block';
    document.getElementById('addPositionForm').reset();
}

function closeAddPositionModal() {
    document.getElementById('addPositionModal').style.display = 'none';
}

async function addDepartment() {
    const name = document.getElementById('departmentName').value.trim();
    
    if (!name) {
        showMessage('Please enter department name.', 'error');
        return;
    }

    try {
        await apiCall('/departments', {
            method: 'POST',
            body: JSON.stringify({ name: name })
        });

        closeAddDepartmentModal();
        loadDepartments(); // Refresh the dropdown
        showMessage('Department added successfully!', 'success');
    } catch (error) {
        // Error message is already shown by apiCall function
    }
}

async function addPosition() {
    const title = document.getElementById('positionName').value.trim();
    
    if (!title) {
        showMessage('Please enter position name.', 'error');
        return;
    }

    try {
        await apiCall('/positions', {
            method: 'POST',
            body: JSON.stringify({ title: title })
        });

        closeAddPositionModal();
        loadPositions(); // Refresh the dropdown
        showMessage('Position added successfully!', 'success');
    } catch (error) {
        // Error message is already shown by apiCall function
    }
}

// Generate auto employee ID based on database
async function generateEmployeeId() {
    try {
        const response = await apiCall('/employees/next-id');
        const nextId = response.nextId;
        const prefix = response.prefix || 'EMP'; // Get prefix from server response
        
        document.getElementById('employeeId').value = nextId;
        
        // Store the prefix for use in other functions if needed
        window.employeePrefix = prefix;
        
    } catch (error) {
        console.error('Error generating employee ID:', error);
        // Fallback to current timestamp if API fails
        const fallbackId = 'EMP' + Date.now().toString().slice(-6);
        document.getElementById('employeeId').value = fallbackId;
        window.employeePrefix = 'EMP';
    }
}

// Validate CNIC format
function validateCNIC(cnic) {
    const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
    return cnicPattern.test(cnic);
}

async function addEmployee() {
    const name = document.getElementById('employeeName').value.trim();
    const id = document.getElementById('employeeId').value.trim();
    const email = document.getElementById('employeeEmail').value.trim();
    const phone = document.getElementById('employeePhone').value.trim();
    const cnic = document.getElementById('employeeCNIC').value.trim();
    const salary = document.getElementById('employeeSalary').value.trim();
    const joiningDate = document.getElementById('employeeJoiningDate').value;
    const department = document.getElementById('employeeDepartment').value;
    const position = document.getElementById('employeePosition').value;
    const fatherName = document.getElementById('employeeFatherName').value.trim();
    const education = document.getElementById('employeeEducation').value.trim();
    const dob = document.getElementById('employeeDOB').value;
    const address = document.getElementById('employeeAddress').value.trim();
    const reference = document.getElementById('employeeReference').value.trim();

    // Validation
    if (!name || !id || !email || !department || !position || !joiningDate || !fatherName || !cnic || !education || !dob || !address) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }

    // Validate CNIC format if provided
    if (cnic && !validateCNIC(cnic)) {
        showMessage('Invalid CNIC format. Please use XXXXX-XXXXXXX-X format.', 'error');
        return;
    }

    try {
        const employeeData = {
            employee_id: id,
            name: name,
            email: email,
            phone: phone,
            cnic: cnic,
            salary: salary ? parseFloat(salary) : null,
            hire_date: joiningDate,
            department: department,
            position: position,
            father_name: fatherName,
            education: education,
            date_of_birth: dob,
            address: address,
            reference: reference || null
        };

        // Add picture data if available
        if (selectedPictureData) {
            employeeData.pictureData = selectedPictureData;
        }

        await apiCall('/employees', {
            method: 'POST',
            body: JSON.stringify(employeeData)
        });

        closeAddEmployeeModal();
        // Clear the selected picture data after successful submission
        selectedPictureData = null;
        clearPicture();
        await loadEmployees();
        loadEmployeesList();
        updateDashboard();
        showMessage('Employee added successfully!', 'success');
    } catch (error) {
        // Error message is already shown by apiCall function
    }
}

async function updateEmployee() {
    const index = document.getElementById('editEmployeeIndex').value;
    const name = document.getElementById('editEmployeeName').value.trim();
    const id = document.getElementById('editEmployeeId').value.trim();
    const email = document.getElementById('editEmployeeEmail').value.trim();
    const phone = document.getElementById('editEmployeePhone').value.trim();
    const cnic = document.getElementById('editEmployeeCNIC').value.trim();
    const salary = document.getElementById('editEmployeeSalary').value.trim();
    const joiningDate = document.getElementById('editEmployeeJoiningDate').value;
    const department = document.getElementById('editEmployeeDepartment').value;
    const position = document.getElementById('editEmployeePosition').value;
    const fatherName = document.getElementById('editEmployeeFatherName').value.trim();
    const education = document.getElementById('editEmployeeEducation').value.trim();
    const dob = document.getElementById('editEmployeeDOB').value;
    const address = document.getElementById('editEmployeeAddress').value.trim();
    const reference = document.getElementById('editEmployeeReference').value.trim();

    // Validation
    if (!name || !id || !email || !department || !position || !joiningDate || !fatherName || !cnic || !education || !dob || !address) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }

    // Validate CNIC format if provided
    if (cnic && !validateCNIC(cnic)) {
        showMessage('Invalid CNIC format. Please use XXXXX-XXXXXXX-X format.', 'error');
        return;
    }

    try {
        const employeeData = {
            name: name,
            email: email,
            phone: phone,
            cnic: cnic,
            salary: salary ? parseFloat(salary) : null,
            hire_date: joiningDate,
            department: department,
            position: position,
            father_name: fatherName,
            education: education,
            date_of_birth: dob,
            address: address,
            reference: reference || null
        };

        // Add picture data if available
        if (selectedPictureData) {
            employeeData.pictureData = selectedPictureData;
        }

        await apiCall(`/employees/${id}`, {
            method: 'PUT',
            body: JSON.stringify(employeeData)
        });

        closeEditEmployeeModal();
        // Clear the selected picture data after successful update
        selectedPictureData = null;
        clearPicture();
        await loadEmployees();
        loadEmployeesList();
        updateDashboard();
        showMessage('Employee updated successfully!', 'success');
    } catch (error) {
        // Error message is already shown by apiCall function
    }
}

async function deleteEmployee(index) {
    if (confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
        const employee = employees[index];
        
        try {
            await apiCall(`/employees/${employee.employee_id}`, {
                method: 'DELETE'
            });

            await loadEmployees();
            loadEmployeesList();
            updateDashboard();
            showMessage('Employee deleted successfully!', 'success');
        } catch (error) {
            // Error message is already shown by apiCall function
        }
    }
}

function loadEmployeesList() {
    const employeesList = document.getElementById('employeesList');
    
    if (employees.length === 0) {
        employeesList.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No employees found</h3><p>Add your first employee to get started.</p></div>';
        return;
    }

    employeesList.innerHTML = employees.map((employee, index) => `
        <div class="employee-card">
            <div class="employee-card-header">
                <div class="employee-card-avatar">
                    ${employee.picture ? 
                        `<img src="${employee.picture}" alt="${employee.name}" class="employee-avatar-img">` : 
                        `<div class="employee-avatar-initials">${employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>`
                    }
                </div>
                <div class="employee-card-info">
                    <h4>${employee.name}</h4>
                    <p>ID: ${employee.employee_id}</p>
                </div>
            </div>
            <div class="employee-card-details">
                <p><i class="fas fa-envelope"></i> ${employee.email}</p>
                <p><i class="fas fa-phone"></i> ${employee.phone || 'Not provided'}</p>
                <p><i class="fas fa-building"></i> ${employee.department}</p>
            </div>
            <div class="employee-card-actions">
                <button class="btn btn-primary btn-sm" onclick="showEditEmployeeModal(${index})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteEmployee(${index})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

function searchEmployees() {
    const searchTerm = document.getElementById('employeeSearch').value.toLowerCase();
    const employeeCards = document.querySelectorAll('.employee-card');
    
    employeeCards.forEach(card => {
        const employeeName = card.querySelector('h4').textContent.toLowerCase();
        const employeeId = card.querySelector('p').textContent.toLowerCase();
        const employeeDepartment = card.querySelectorAll('p')[2].textContent.toLowerCase();
        
        if (employeeName.includes(searchTerm) || employeeId.includes(searchTerm) || employeeDepartment.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Work Records Functions
async function loadWorkRecordsForDate(date = null) {
    const dateInput = document.getElementById('workRecordsDate');
    if (date) {
        currentDate = date;
        dateInput.value = date;
    } else if (dateInput.value) {
        currentDate = dateInput.value;
    } else {
        dateInput.value = currentDate;
    }

    const workRecordsList = document.getElementById('workRecordsList');
    
    if (employees.length === 0) {
        workRecordsList.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-day"></i><h3>No employees found</h3><p>Add employees first to mark work records.</p></div>';
        return;
    }

    // Load work records data from API
    try {
        const workRecordsData = await apiCall(`/work-records/${currentDate}`);
        workRecords[currentDate] = {};
        workRecordsData.forEach(item => {
            workRecords[currentDate][item.employee_id] = item.status || 'absent';
        });
    } catch (error) {
        console.error('Failed to load work records:', error);
        workRecords[currentDate] = {};
    }
    
    const todayWorkRecords = workRecords[currentDate] || {};
    
    workRecordsList.innerHTML = employees.map(employee => {
        const employeeWorkRecord = todayWorkRecords[employee.employee_id] || 'absent';
        return `
            <div class="work-record-item">
                <div class="employee-info">
                    <div class="employee-avatar">
                        ${employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div class="employee-details">
                        <h4>${employee.name}</h4>
                        <p>${employee.employee_id} • ${employee.department}</p>
                    </div>
                </div>
                <div class="work-record-actions">
                    <button class="btn btn-success btn-sm ${employeeWorkRecord === 'present' ? 'active' : ''}" 
                            onclick="markWorkRecord('${employee.employee_id}', 'present')">
                        <i class="fas fa-check"></i> Present
                    </button>
                    <button class="btn btn-warning btn-sm ${employeeWorkRecord === 'sick_leave' ? 'active' : ''}" 
                            onclick="markWorkRecord('${employee.employee_id}', 'sick_leave')">
                        <i class="fas fa-thermometer-half"></i> Sick Leave
                    </button>
                    <button class="btn btn-info btn-sm ${employeeWorkRecord === 'vacation' ? 'active' : ''}" 
                            onclick="markWorkRecord('${employee.employee_id}', 'vacation')">
                        <i class="fas fa-plane"></i> Vacation
                    </button>
                    <button class="btn btn-danger btn-sm ${employeeWorkRecord === 'absent' ? 'active' : ''}" 
                            onclick="markWorkRecord('${employee.employee_id}', 'absent')">
                        <i class="fas fa-times"></i> Absent
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

async function markWorkRecord(employeeId, status) {
    try {
        await apiCall('/work-records', {
            method: 'POST',
            body: JSON.stringify({
                employee_id: employeeId,
                date: currentDate,
                status: status
            })
        });

        // Update local data
        if (!workRecords[currentDate]) {
            workRecords[currentDate] = {};
        }
        workRecords[currentDate][employeeId] = status;
        
        loadWorkRecordsForDate();
        updateDashboard();
        
        const employee = employees.find(e => e.employee_id === employeeId);
        showMessage(`${employee.name} marked as ${status.replace('_', ' ')}!`, 'success');
    } catch (error) {
        // Error message is already shown by apiCall function
    }
}

async function markAllPresent() {
    if (employees.length === 0) {
        showMessage('No employees to mark work records for.', 'error');
        return;
    }
    
    try {
        const workRecordsData = employees.map(employee => ({
            employee_id: employee.employee_id,
            date: currentDate,
            status: 'present'
        }));

        await apiCall('/work-records/bulk', {
            method: 'POST',
            body: JSON.stringify({
                date: currentDate,
                work_records_data: workRecordsData
            })
        });

        // Update local data
        if (!workRecords[currentDate]) {
            workRecords[currentDate] = {};
        }
        employees.forEach(employee => {
            workRecords[currentDate][employee.employee_id] = 'present';
        });
        
        loadWorkRecordsForDate();
        updateDashboard();
        showMessage('All employees marked as present!', 'success');
    } catch (error) {
        // Error message is already shown by apiCall function
    }
}

async function markAllAbsent() {
    if (employees.length === 0) {
        showMessage('No employees to mark work records for.', 'error');
        return;
    }
    
    try {
        const workRecordsData = employees.map(employee => ({
            employee_id: employee.employee_id,
            date: currentDate,
            status: 'absent'
        }));

        await apiCall('/work-records/bulk', {
            method: 'POST',
            body: JSON.stringify({
                date: currentDate,
                work_records_data: workRecordsData
            })
        });

        // Update local data
        if (!workRecords[currentDate]) {
            workRecords[currentDate] = {};
        }
        employees.forEach(employee => {
            workRecords[currentDate][employee.employee_id] = 'absent';
        });
        
        loadWorkRecordsForDate();
        updateDashboard();
        showMessage('All employees marked as absent!', 'success');
    } catch (error) {
        // Error message is already shown by apiCall function
    }
}

// Save work records function
async function saveWorkRecords() {
    if (employees.length === 0) {
        showMessage('No employees to save work records for.', 'error');
        return;
    }
    
    const todayWorkRecords = workRecords[currentDate] || {};
    const hasRecords = Object.keys(todayWorkRecords).length > 0;
    
    if (!hasRecords) {
        showMessage('No work records to save. Please mark attendance first.', 'warning');
        return;
    }
    
    try {
        const workRecordsData = employees.map(employee => ({
            employee_id: employee.employee_id,
            date: currentDate,
            status: todayWorkRecords[employee.employee_id] || 'absent'
        }));

        await apiCall('/work-records/bulk', {
            method: 'POST',
            body: JSON.stringify({
                date: currentDate,
                work_records_data: workRecordsData
            })
        });
        
        loadWorkRecordsForDate();
        updateDashboard();
        showMessage('Work records saved successfully!', 'success');
    } catch (error) {
        // Error message is already shown by apiCall function
    }
}

// Reports Functions
async function generateReport() {
    const employeeSelect = document.getElementById('reportEmployee');
    const monthInput = document.getElementById('reportMonth');
    const reportContent = document.getElementById('reportContent');
    
    // Populate employee dropdown if not already populated
    if (employeeSelect.children.length <= 1) {
        employeeSelect.innerHTML = '<option value="">Select Employee</option>' +
            employees.map(employee => `<option value="${employee.employee_id}">${employee.name} (${employee.employee_id})</option>`).join('');
    }
    
    // Set default month to current month
    if (!monthInput.value) {
        const now = new Date();
        monthInput.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    }
    
    const selectedEmployee = employeeSelect.value;
    const selectedMonth = monthInput.value;
    
    if (!selectedEmployee || !selectedMonth) {
        reportContent.innerHTML = '<div class="empty-state"><i class="fas fa-chart-bar"></i><h3>Select an employee and month</h3><p>Choose an employee and month to generate work records report.</p></div>';
        return;
    }
    
    try {
        const reportData = await apiCall(`/reports/employee/${selectedEmployee}/${selectedMonth}`);
        
        const year = parseInt(selectedMonth.split('-')[0]);
        const month = parseInt(selectedMonth.split('-')[1]);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        let presentDays = 0;
        let absentDays = 0;
        let sickLeaveDays = 0;
        let vacationDays = 0;
        let lateDays = 0;
        
        const workRecordsMap = {};
        reportData.work_records.forEach(record => {
            // Convert API date format (2025-09-20T19:00:00.000Z) to frontend format (2025-09-21)
            const apiDate = new Date(record.date);
            const frontendDate = apiDate.toISOString().split('T')[0];
            workRecordsMap[frontendDate] = record.status;
            if (record.status === 'present') {
                presentDays++;
            } else if (record.status === 'absent') {
                absentDays++;
            } else if (record.status === 'sick_leave') {
                sickLeaveDays++;
            } else if (record.status === 'vacation') {
                vacationDays++;
            } else if (record.status === 'late') {
                lateDays++;
            }
        });
        
        const reportCalendar = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateString = date.toISOString().split('T')[0];
            
            // Check if it's a Sunday (day 0) - typically not a working day
            const dayOfWeek = date.getDay();
            const isSunday = dayOfWeek === 0;
            
            // Use the same logic as individual report
            let status;
            if (workRecordsMap[dateString]) {
                status = workRecordsMap[dateString];
            } else if (isSunday) {
                status = 'weekend'; // Don't mark Sundays as absent
            } else {
                status = 'no-record'; // Use a different status for days without records
            }
            
            reportCalendar.push({
                date: dateString,
                day: day,
                status: status,
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
            });
        }
        
        // Calculate attendance rate based on working days (exclude Sundays)
        const workingDays = reportCalendar.filter(day => {
            const dayOfWeek = new Date(day.date).getDay();
            return dayOfWeek !== 0; // Exclude Sunday (0)
        }).length;
        
        // Count attending days (present + late)
        const attendingDays = presentDays + lateDays;
        const attendanceRate = workingDays > 0 ? Math.round((attendingDays / workingDays) * 100) : 0;
        
        reportContent.innerHTML = `
            <div class="report-header">
                <h3>Work Records Report for ${reportData.employee.name}</h3>
                <p>Month: ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            
            <div class="report-stats">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${presentDays}</h3>
                        <p>Present Days</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon absent">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${absentDays}</h3>
                        <p>Absent Days</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-thermometer-half"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${sickLeaveDays}</h3>
                        <p>Sick Leave</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-plane"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${vacationDays}</h3>
                        <p>Vacation Days</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${attendanceRate}%</h3>
                        <p>Attendance Rate</p>
                    </div>
                </div>
            </div>
            
            <div class="report-calendar">
                <h4>Daily Work Records</h4>
                <div class="calendar-grid">
                    ${reportCalendar.map(day => {
                        const dayOfWeek = new Date(day.date).getDay();
                        const isSunday = dayOfWeek === 0;
                        console.log(`Total Report - Day: ${day.day}, Status: ${day.status}, isSunday: ${isSunday}`);
                        return `
                        <div class="calendar-day ${day.status} ${isSunday ? 'sunday' : ''}">
                            <div class="day-number">${day.day}</div>
                            <div class="day-status">
                                ${day.status === 'present' ? '<i class="fas fa-check"></i>' : 
                                  day.status === 'absent' ? '<i class="fas fa-times"></i>' : 
                                  day.status === 'sick_leave' ? '<i class="fas fa-thermometer-half"></i>' :
                                  day.status === 'vacation' ? '<i class="fas fa-plane"></i>' :
                                  day.status === 'late' ? '<i class="fas fa-clock"></i>' :
                                  day.status === 'weekend' ? '<i class="fas fa-calendar-times"></i>' :
                                  day.status === 'no-record' ? '<i class="fas fa-question"></i>' :
                                  '<i class="fas fa-minus"></i>'}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
    } catch (error) {
        reportContent.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading report</h3><p>Failed to load work records report. Please try again.</p></div>';
    }
}

async function exportReport() {
    const employeeSelect = document.getElementById('reportEmployee');
    const monthInput = document.getElementById('reportMonth');
    const formatSelect = document.getElementById('exportFormat');
    
    if (!employeeSelect.value || !monthInput.value) {
        showMessage('Please select an employee and month to export report.', 'error');
        return;
    }
    
    const format = formatSelect.value;
    
    try {
        const reportData = await apiCall(`/reports/employee/${employeeSelect.value}/${monthInput.value}`);
        
        const selectedMonth = monthInput.value;
        const year = parseInt(selectedMonth.split('-')[0]);
        const month = parseInt(selectedMonth.split('-')[1]);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        const workRecordsMap = {};
        reportData.work_records.forEach(record => {
            // Convert ISO date to YYYY-MM-DD format for matching
            const dateKey = record.date.split('T')[0];
            workRecordsMap[dateKey] = record.status;
        });
        
        const reportRows = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateString = date.toISOString().split('T')[0];
            const status = workRecordsMap[dateString] || 'Not Marked';
            reportRows.push({ date: dateString, day, status });
        }
        
        if (format === 'csv') {
            exportToCSV(reportData, reportRows, selectedMonth);
        } else if (format === 'pdf') {
            exportToPDF(reportData, reportRows, selectedMonth);
        }
        
        showMessage(`Report exported successfully as ${format.toUpperCase()}!`, 'success');
    } catch (error) {
        showMessage('Failed to export report. Please try again.', 'error');
    }
}

function exportToCSV(reportData, reportRows, selectedMonth) {
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    
    let csvContent = `Work Records Report for ${reportData.employee.name}\n`;
    csvContent += `Month: ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}\n\n`;
    csvContent += `Date,Day,Status\n`;
    
    reportRows.forEach(row => {
        csvContent += `${row.date},${row.day},${row.status}\n`;
    });
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work_records_report_${reportData.employee.name}_${selectedMonth}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function exportToPDF(reportData, reportRows, selectedMonth) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]);
    const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Work Records Report', 20, 20);
    
    // Employee info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Employee: ${reportData.employee.name}`, 20, 35);
    doc.text(`Month: ${monthName}`, 20, 45);
    
    // Calculate statistics
    const presentDays = reportRows.filter(row => row.status === 'present').length;
    const absentDays = reportRows.filter(row => row.status === 'absent').length;
    const sickLeaveDays = reportRows.filter(row => row.status === 'sick_leave').length;
    const personalLeaveDays = reportRows.filter(row => row.status === 'personal_leave').length;
    const notMarkedDays = reportRows.filter(row => row.status === 'Not Marked').length;
    
    // Statistics
    doc.text('Summary:', 20, 60);
    doc.text(`Present: ${presentDays} days`, 30, 70);
    doc.text(`Absent: ${absentDays} days`, 30, 80);
    doc.text(`Sick Leave: ${sickLeaveDays} days`, 30, 90);
    doc.text(`Personal Leave: ${personalLeaveDays} days`, 30, 100);
    doc.text(`Not Marked: ${notMarkedDays} days`, 30, 110);
    
    // Table header
    doc.setFont(undefined, 'bold');
    doc.text('Date', 20, 130);
    doc.text('Day', 60, 130);
    doc.text('Status', 100, 130);
    
    // Draw line under header
    doc.line(20, 132, 180, 132);
    
    // Table content
    doc.setFont(undefined, 'normal');
    let yPosition = 145;
    
    reportRows.forEach((row, index) => {
        if (yPosition > 270) { // Start new page if needed
            doc.addPage();
            yPosition = 20;
        }
        
        doc.text(row.date, 20, yPosition);
        doc.text(row.day.toString(), 60, yPosition);
        doc.text(row.status, 100, yPosition);
        yPosition += 10;
    });
    
    // Save PDF
    doc.save(`work_records_report_${reportData.employee.name}_${selectedMonth}.pdf`);
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Insert message at the top of main content
    const mainContent = document.querySelector('.main-content');
    mainContent.insertBefore(messageDiv, mainContent.firstChild);
    
    // Auto remove message after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Camera functionality variables
let currentStream = null;
let selectedPictureData = null;

// Handle file upload
function handleFileUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            showPicturePreview(e.target.result);
            selectedPictureData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Show picture preview
function showPicturePreview(imageSrc) {
    const preview = document.getElementById('picturePreview');
    const previewImage = document.getElementById('previewImage');
    const clearBtn = document.getElementById('clearPictureBtn');
    
    previewImage.src = imageSrc;
    preview.style.display = 'block';
    clearBtn.style.display = 'inline-block';
}

// Clear picture
function clearPicture() {
    const preview = document.getElementById('picturePreview');
    const clearBtn = document.getElementById('clearPictureBtn');
    const fileInput = document.getElementById('employeePictureFile');
    
    preview.style.display = 'none';
    clearBtn.style.display = 'none';
    fileInput.value = '';
    selectedPictureData = null;
    
    // Close camera if open
    closeCamera();
}

// Handle file upload for Edit Employee modal
function handleEditFileUpload(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            showEditPicturePreview(e.target.result);
            selectedPictureData = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Show picture preview for Edit Employee modal
function showEditPicturePreview(imageSrc) {
    const preview = document.getElementById('editPicturePreview');
    const previewImage = document.getElementById('editPreviewImage');
    const clearBtn = document.getElementById('clearEditPictureBtn');
    
    previewImage.src = imageSrc;
    preview.style.display = 'block';
    clearBtn.style.display = 'inline-block';
}

// Clear picture for Edit Employee modal
function clearEditPicture() {
    const preview = document.getElementById('editPicturePreview');
    const clearBtn = document.getElementById('clearEditPictureBtn');
    const fileInput = document.getElementById('editEmployeePictureFile');
    
    preview.style.display = 'none';
    clearBtn.style.display = 'none';
    fileInput.value = '';
    selectedPictureData = null;
    
    // Close camera if open
    closeCamera();
}

// Open camera for Edit Employee modal
async function openEditCamera() {
    try {
        console.log('🎥 Attempting to access camera for edit modal...');
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia not supported in this browser');
        }
        
        const video = document.getElementById('cameraVideo');
        const cameraControls = document.getElementById('cameraControls');
        const cameraBtn = document.getElementById('editCameraBtn');
        
        // Check if video element exists
        if (!video) {
            console.error('❌ Video element not found in DOM');
            showMessage('Camera interface not found. Please refresh the page.', 'error');
            return;
        }
        
        console.log('📋 Requesting camera permissions...');
        currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            } 
        });
        
        console.log('✅ Camera access granted, setting up video stream...');
        video.srcObject = currentStream;
        video.style.display = 'block';
        cameraControls.style.display = 'block';
        cameraBtn.style.display = 'none';
        
        // Set flag to indicate we're in edit mode
        video.dataset.editMode = 'true';
        
        // Show camera modal if it exists
        const modal = document.getElementById('cameraModal');
        if (modal) {
            modal.style.display = 'block';
        }
        
        await video.play();
        console.log('🎬 Camera is now active and streaming');
        showMessage('Camera is ready! Position yourself and click "Capture Photo".', 'success');
        
    } catch (error) {
        console.error('❌ Camera access failed:', error);
        let errorMessage = 'Camera access failed. ';
        
        if (error.name === 'NotAllowedError') {
            errorMessage += 'Please allow camera permissions and try again.';
        } else if (error.name === 'NotFoundError') {
            errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage += 'Camera not supported in this browser.';
        } else {
            errorMessage += error.message;
        }
        
        showMessage(errorMessage, 'error');
    }
}

async function openCamera() {
    try {
        console.log('🎥 Attempting to access camera...');
        
        // Check if getUserMedia is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('getUserMedia not supported in this browser');
        }
        
        const video = document.getElementById('cameraVideo');
        const cameraControls = document.getElementById('cameraControls');
        const cameraBtn = document.getElementById('cameraBtn');
        
        // Check if video element exists
        if (!video) {
            console.error('❌ Video element not found in DOM');
            showMessage('Camera interface not found. Please refresh the page.', 'error');
            return;
        }
        
        console.log('📋 Requesting camera permissions...');
        currentStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            } 
        });
        
        console.log('✅ Camera access granted, setting up video stream...');
        video.srcObject = currentStream;
        video.style.display = 'block';
        cameraControls.style.display = 'block';
        cameraBtn.style.display = 'none';
        
        // Show camera modal if it exists
        const modal = document.getElementById('cameraModal');
        if (modal) {
            modal.style.display = 'block';
        }
        
        await video.play();
        console.log('🎬 Camera is now active and streaming');
        showMessage('Camera is ready! Position yourself and click "Capture Photo".', 'success');
        
    } catch (error) {
        console.error('❌ Camera Error Details:', {
            name: error.name,
            message: error.message,
            constraint: error.constraint,
            stack: error.stack
        });
        
        let errorMessage = '';
        let troubleshooting = '';
        
        switch (error.name) {
            case 'NotAllowedError':
                errorMessage = 'Camera permission denied by user or browser policy.';
                troubleshooting = 'Try: 1) Click camera icon in address bar → Allow, 2) Check browser settings, 3) Restart browser';
                break;
            case 'NotFoundError':
                errorMessage = 'No camera device found on this system.';
                troubleshooting = 'Check if camera is connected and not being used by another app';
                break;
            case 'NotReadableError':
                errorMessage = 'Camera is already in use by another application.';
                troubleshooting = 'Close other apps using camera (Zoom, Teams, Skype, etc.) and try again';
                break;
            case 'OverconstrainedError':
                errorMessage = 'Camera constraints cannot be satisfied.';
                troubleshooting = 'Your camera may not support the requested resolution';
                break;
            case 'SecurityError':
                errorMessage = 'Camera access blocked due to security policy.';
                troubleshooting = 'Try using HTTPS or check browser security settings';
                break;
            default:
                errorMessage = `Camera error: ${error.message}`;
                troubleshooting = 'Try refreshing the page or using file upload instead';
        }
        
        showMessage(`${errorMessage}\n\n💡 ${troubleshooting}`, 'error');
    }
}


function closeCamera() {
    const video = document.getElementById('cameraVideo');
    const modal = document.getElementById('cameraModal');
    
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    if (video) {
        video.style.display = 'none';
    }
    
    if (modal) {
        modal.style.display = 'none';
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const context = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/png');
    selectedPictureData = imageData;
    
    // Check if we're in edit mode
    if (video.dataset.editMode === 'true') {
        showEditPicturePreview(imageData);
    } else {
        showPicturePreview(imageData);
    }
    
    closeCamera();
    showMessage('Photo captured successfully!', 'success');
}

// Function to help users revoke camera permissions
function revokeCameraPermissions() {
    showMessage('To revoke camera permissions:\n1. Click the camera/lock icon in your browser address bar\n2. Set camera permission to "Block" or "Ask"\n3. Refresh the page\n\nAlternatively, go to browser settings > Privacy & Security > Site Settings > Camera', 'info');
}

// Diagnostic function to test camera availability
async function testCameraAccess() {
    console.log('🔍 Running camera diagnostic...');
    
    try {
        // Check basic browser support
        if (!navigator.mediaDevices) {
            console.log('❌ navigator.mediaDevices not supported');
            showMessage('Your browser does not support camera access.', 'error');
            return;
        }
        
        // Get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('📹 Available video devices:', videoDevices.length);
        videoDevices.forEach((device, index) => {
            console.log(`Device ${index + 1}: ${device.label || 'Unknown Camera'} (${device.deviceId})`);
        });
        
        if (videoDevices.length === 0) {
            showMessage('No camera devices found on this system.', 'error');
            return;
        }
        
        // Test basic camera access
        console.log('🧪 Testing basic camera access...');
        const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        console.log('✅ Camera test successful!');
        showMessage(`Camera test passed! Found ${videoDevices.length} camera(s). You can now use the camera feature.`, 'success');
        
        // Clean up test stream
        testStream.getTracks().forEach(track => track.stop());
        
    } catch (error) {
        console.error('🔍 Diagnostic Error:', error);
        showMessage(`Camera diagnostic failed: ${error.name} - ${error.message}`, 'error');
    }
}

function initializeApp() {
    // Set default date to today
    document.getElementById('workRecordsDate').value = currentDate;
    
    // Close modals when clicking outside
    window.onclick = function(event) {
        const addModal = document.getElementById('addEmployeeModal');
        const editModal = document.getElementById('editEmployeeModal');
        
        if (event.target === addModal) {
            closeAddEmployeeModal();
        }
        if (event.target === editModal) {
            closeEditEmployeeModal();
        }
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(event) {
        // Ctrl/Cmd + N to add new employee
        if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
            event.preventDefault();
            showAddEmployeeModal();
        }
        
        // Escape to close modals
        if (event.key === 'Escape') {
            closeAddEmployeeModal();
            closeEditEmployeeModal();
        }
    });
}

// Add CSS for report calendar}

// Function to show individual employee detail report
async function showEmployeeDetailReport(employeeId, selectedMonth) {
    const individualReportSection = document.getElementById('individualEmployeeReport');
    const individualReportContent = document.getElementById('individualReportContent');
    const individualReportTitle = document.getElementById('individualReportTitle');
    
    try {
        // Fetch individual employee report data
        const reportData = await apiCall(`/reports/employee/${employeeId}/${selectedMonth}`);
        
        // Check if reportData and work_records exist
        if (!reportData || !reportData.work_records) {
            throw new Error('Invalid report data received from server');
        }
        
        // Normalize the data structure for compatibility
        reportData.workRecords = reportData.work_records;
        
        const year = parseInt(selectedMonth.split('-')[0]);
        const month = parseInt(selectedMonth.split('-')[1]);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // Create a map of work records by date
        const workRecordsMap = {};
        reportData.work_records.forEach(record => {
            // Convert API date format (2025-09-20T19:00:00.000Z) to frontend format (2025-09-21)
            const apiDate = new Date(record.date);
            const frontendDate = apiDate.toISOString().split('T')[0];
            workRecordsMap[frontendDate] = record.status;
        });
        
        // Generate calendar data for the month
        const reportCalendar = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateString = date.toISOString().split('T')[0];
            
            // Check if it's a Sunday (day 0) - typically not a working day
            const dayOfWeek = date.getDay();
            const isSunday = dayOfWeek === 0;
            
            // Use the same logic as individual report
            let status;
            if (workRecordsMap[dateString]) {
                status = workRecordsMap[dateString];
            } else if (isSunday) {
                status = 'weekend'; // Don't mark Sundays as absent
            } else {
                status = 'no-record'; // Use a different status for days without records
            }
            
            reportCalendar.push({
                day: day,
                date: dateString,
                status: status
            });
        }
        
        // Count different status types
        let presentDays = 0;
        let absentDays = 0;
        let sickLeaveDays = 0;
        let vacationDays = 0;
        let lateDays = 0;
        
        reportData.work_records.forEach(record => {
            if (record.status === 'present') {
                presentDays++;
            } else if (record.status === 'absent') {
                absentDays++;
            } else if (record.status === 'sick_leave') {
                sickLeaveDays++;
            } else if (record.status === 'vacation') {
                vacationDays++;
            } else if (record.status === 'late') {
                lateDays++;
            }
        });
        
        // Calculate attendance rate based on working days (exclude Sundays)
        const workingDays = reportCalendar.filter(day => {
            const dayOfWeek = new Date(day.date).getDay();
            return dayOfWeek !== 0; // Exclude Sunday (0)
        }).length;
        
        // Count attending days (present + late)
        const attendingDays = presentDays + lateDays;
        const attendanceRate = workingDays > 0 ? Math.round((attendingDays / workingDays) * 100) : 0;
        
        individualReportTitle.textContent = `${reportData.employee.name} - ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
        
        individualReportContent.innerHTML = `
            <div class="employee-info">
                <div class="employee-card">
                    <div class="employee-details">
                        <h4>${reportData.employee.name}</h4>
                        <p><strong>Employee ID:</strong> ${reportData.employee.employee_id}</p>
                        <p><strong>Department:</strong> ${reportData.employee.department}</p>
                        <p><strong>Position:</strong> ${reportData.employee.position}</p>
                    </div>
                </div>
            </div>
            
            <div class="report-stats">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${presentDays}</h3>
                        <p>Present Days</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon absent">
                        <i class="fas fa-calendar-times"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${absentDays}</h3>
                        <p>Absent Days</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${lateDays}</h3>
                        <p>Late Days</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-thermometer-half"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${sickLeaveDays}</h3>
                        <p>Sick Leave</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-plane"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${vacationDays}</h3>
                        <p>Vacation Days</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-info">
                        <h3>${attendanceRate}%</h3>
                        <p>Attendance Rate</p>
                    </div>
                </div>
            </div>
            
            <div class="report-calendar">
                <h4>Daily Work Records</h4>
                <div class="calendar-grid">
                    ${reportCalendar.map(day => {
                        const dayOfWeek = new Date(day.date).getDay();
                        const isSunday = dayOfWeek === 0;
                        return `
                        <div class="calendar-day ${day.status} ${isSunday ? 'sunday' : ''}">
                            <div class="day-number">${day.day}</div>
                            <div class="day-status">
                                ${day.status === 'present' ? '<i class="fas fa-check"></i>' : 
                                  day.status === 'absent' ? '<i class="fas fa-times"></i>' : 
                                  day.status === 'sick_leave' ? '<i class="fas fa-thermometer-half"></i>' :
                                  day.status === 'vacation' ? '<i class="fas fa-plane"></i>' :
                                  day.status === 'late' ? '<i class="fas fa-clock"></i>' :
                                  day.status === 'weekend' ? '<i class="fas fa-calendar-times"></i>' :
                                  day.status === 'no-record' ? '<i class="fas fa-question"></i>' :
                                  '<i class="fas fa-minus"></i>'}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `;
        
        // Show the individual report section
        individualReportSection.style.display = 'block';
        
        // Scroll to the individual report
        individualReportSection.scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error loading individual employee report:', error);
        individualReportContent.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading report</h3><p>Failed to load employee report. Please try again.</p></div>';
        individualReportSection.style.display = 'block';
    }
}

// Function to hide individual employee report
function hideIndividualReport() {
    const individualReportSection = document.getElementById('individualEmployeeReport');
    individualReportSection.style.display = 'none';
}

// Function to search employees in total report
function searchTotalReportEmployees() {
    const searchInput = document.getElementById('employeeSearch');
    const searchTerm = searchInput.value.toLowerCase();
    const employeeSummaryBody = document.getElementById('employeeSummaryBody');
    
    if (!window.currentTotalReportData) return;
    
    const filteredEmployees = window.currentTotalReportData.employeeSummary.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm) || 
        emp.employee_id.toLowerCase().includes(searchTerm)
    );
    
    const selectedMonth = document.getElementById('totalReportMonth').value;
    
    employeeSummaryBody.innerHTML = filteredEmployees.map(emp => `
        <tr class="employee-row" onclick="showEmployeeDetailReport('${emp.employee_id}', '${selectedMonth}')" style="cursor: pointer;">
            <td>${emp.employee_id}</td>
            <td>${emp.name}</td>
            <td class="present-count">${emp.presentDays}</td>
            <td class="absent-count">${emp.absentDays}</td>
            <td class="attendance-rate">${emp.attendanceRate}%</td>
        </tr>
    `).join('');
}

const additionalCSS = `
.report-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.report-calendar {
    margin-top: 30px;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 10px;
    margin-top: 15px;
}

.calendar-day {
    background: #f8fafc;
    border: 2px solid #e2e8f0;
    border-radius: 10px;
    padding: 15px;
    text-align: center;
    transition: all 0.3s ease;
}

.calendar-day.sunday {
    background: #fef3c7 !important;
    border-color: #fbbf24 !important;
    color: #92400e !important;
}

.calendar-day.present {
    background: #c6f6d5 !important;
    border-color: #9ae6b4 !important;
    color: #22543d !important;
}

.calendar-day.absent {
    background: #fed7d7 !important;
    border-color: #feb2b2 !important;
    color: #742a2a !important;
}

.calendar-day.sick-leave {
    background: #fef5e7 !important;
    border-color: #f6e05e !important;
    color: #744210 !important;
}

.calendar-day.personal-leave {
    background: #e6fffa !important;
    border-color: #81e6d9 !important;
    color: #234e52 !important;
}

.calendar-day.weekend {
    background: #fef3c7 !important;
    border-color: #fbbf24 !important;
    color: #92400e !important;
}

.calendar-day.no-record {
    background: #fef3c7 !important;
    border-color: #fbbf24 !important;
    color: #92400e !important;
}

.day-number {
    font-weight: 700;
    font-size: 1.1rem;
    margin-bottom: 5px;
}

.day-status {
    font-size: 1.2rem;
}

.btn.active {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);
