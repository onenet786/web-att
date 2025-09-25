# ONENET-ATT - Employee Attendance System

A comprehensive web-based employee attendance management system with modern UI themes and real-time tracking capabilities.

## Features

### 🎯 Core Functionality
- **Employee Management**: Add, edit, and delete employee records
- **Work Records Tracking**: Mark daily work status (Present/Absent/Sick Leave/Personal Leave)
- **Real-time Dashboard**: Live statistics and recent activity updates
- **Reports & Export**: Generate detailed work records reports and export to CSV
- **MySQL Database**: Robust data persistence with MySQL database
- **RESTful API**: Complete backend API for all operations

### 🎨 User Interface
- **Modern Design**: Beautiful gradient backgrounds and smooth animations
- **Responsive Layout**: Works perfectly on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Easy-to-use tabbed interface
- **Interactive Elements**: Hover effects, loading animations, and visual feedback

### 📊 Dashboard Features
- Total employees count
- Present/Absent counts for today
- Overall work record rate
- Recent activity feed

### 👥 Employee Management
- Add new employees with complete information
- Edit existing employee details
- Delete employees (with confirmation)
- Search functionality
- Employee ID and email validation

### 📅 Work Records System
- Daily work record marking
- Multiple status options (Present/Absent/Sick Leave/Personal Leave)
- Bulk operations (Mark all present/absent)
- Date selection for historical data
- Visual status indicators

### 📈 Reports & Analytics
- Individual employee work record reports
- Monthly work record summaries
- Visual calendar view
- CSV export functionality
- Work record rate calculations

## Getting Started

### Prerequisites
- **Node.js** (version 14 or higher)
- **MySQL Server** (version 5.7 or higher)
- **npm** (comes with Node.js)

### Quick Installation

#### Option 1: Automated Setup (Windows)
1. Run `quick-start.bat` as Administrator
2. Follow the prompts to install MySQL and set up the system

#### Option 2: Manual Setup
1. **Install MySQL:**
   - Download from [mysql.com](https://dev.mysql.com/downloads/installer/)
   - Or run `install-mysql.ps1` as Administrator (Windows)

2. **Configure Database:**
   ```bash
   # Edit config.env file
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=employee_system
   ```

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Initialize Database:**
   ```bash
   npm run init-db
   ```

5. **Start the Application:**
   ```bash
   npm start
   ```

6. **Access the System:**
   - Open `http://localhost:3000` in your browser

### File Structure
```
employee-management-system/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # Frontend JavaScript (API integration)
├── server.js           # Node.js backend server
├── package.json        # Node.js dependencies
├── config.env          # Database configuration
├── init-database.js    # Database initialization script
├── install-mysql.ps1   # MySQL installation script (Windows)
├── quick-start.bat     # Automated setup script (Windows)
├── SETUP.md            # Detailed setup guide
└── README.md           # This documentation
```

## How to Use

### 1. Adding Employees
- Click the "Add Employee" button in the header
- Fill in the required information:
  - Name (required)
  - Employee ID (must be unique)
  - Email address
  - Phone number
  - Department
- Click "Add Employee" to save

### 2. Marking Work Records
- Navigate to the "Work Records" tab
- Select a date using the date picker
- Mark each employee as Present, Absent, Sick Leave, or Personal Leave
- Use bulk actions to mark all employees at once
- Click "Save Work Records" to persist changes

### 3. Generating Reports
- Go to the "Reports" tab
- Select an employee from the dropdown
- Choose a month to generate the report
- View detailed work record statistics
- Export the report as CSV if needed

### 4. Managing Employees
- Use the "Employees" tab to view all employees
- Search for specific employees using the search box
- Edit employee information by clicking the "Edit" button
- Delete employees using the "Delete" button (with confirmation)

## Keyboard Shortcuts

- `Ctrl/Cmd + N`: Add new employee
- `Escape`: Close modal dialogs

## Data Storage

The system uses MySQL database for data storage:
- **Employees**: Stored in `employees` table
- **Work Records**: Stored in `work_records` table
- **Database**: `employee_system` with proper relationships
- **Backup**: Full database backup and restore capabilities

## Sample Data

The system comes with 3 sample employees to help you get started:
- John Doe (Computer Science)
- Jane Smith (Mathematics)
- Mike Johnson (Physics)

You can delete these and add your own employees.

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Customization

### Adding New Fields
To add new employee fields:
1. Update the HTML form in `index.html`
2. Modify the employee object structure in `script.js`
3. Update the display functions accordingly

### Styling Changes
All styles are in `styles.css`. The system uses CSS custom properties and modern features like:
- CSS Grid and Flexbox
- CSS Variables
- Backdrop filters
- Smooth transitions

### Adding New Features
The modular JavaScript structure makes it easy to add new features:
- Data management functions
- UI update functions
- Event handlers
- Utility functions

## Troubleshooting

### Data Not Saving
- Ensure your browser supports localStorage
- Check if you're in private/incognito mode (localStorage may be disabled)
- Clear browser cache and try again

### Styling Issues
- Ensure all CSS files are loaded properly
- Check browser console for any errors
- Verify Font Awesome icons are loading

### Performance Issues
- The system is optimized for up to 1000 employees
- For larger datasets, consider implementing pagination
- Clear old work record data periodically

## Future Enhancements

Potential features for future versions:
- User authentication and roles
- Multiple class/course management
- Advanced reporting with charts
- Email notifications
- Backup and restore functionality
- Multi-language support
- API integration
- Mobile app version

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure all files are in the same directory
3. Try refreshing the page
4. Clear browser cache and localStorage

## License

This project is open source and available under the MIT License.

---

**Enjoy using your Employee Management System!** 🎉
