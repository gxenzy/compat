-- Initialize database schema
USE energyauditdb;

-- Make sure we have the correct user permissions
GRANT ALL PRIVILEGES ON energyauditdb.* TO 'sdmi'@'%';
FLUSH PRIVILEGES;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  role ENUM('admin','manager','auditor','reviewer','viewer','staff','moderator','user') NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create findings table
CREATE TABLE IF NOT EXISTS findings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  section ENUM('lighting', 'hvac', 'envelope') NOT NULL,
  severity ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL,
  status ENUM('Open', 'In Progress', 'Resolved') NOT NULL DEFAULT 'Open',
  estimated_cost DECIMAL(10, 2),
  assignee_id INT UNSIGNED,
  created_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  approval_status ENUM('Draft', 'Pending Review', 'Manager Approval', 'Final Approval', 'Approved', 'Rejected') NOT NULL DEFAULT 'Draft',
  FOREIGN KEY (assignee_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_section (section),
  INDEX idx_severity (severity),
  INDEX idx_status (status),
  INDEX idx_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create power readings table
CREATE TABLE IF NOT EXISTS power_readings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  timestamp TIMESTAMP NOT NULL,
  power_usage DECIMAL(10, 2) NOT NULL,
  voltage DECIMAL(6, 2) NOT NULL,
  current DECIMAL(6, 2) NOT NULL,
  power_factor DECIMAL(4, 2) NOT NULL,
  frequency DECIMAL(4, 2) NOT NULL,
  temperature DECIMAL(4, 1) NOT NULL,
  humidity DECIMAL(4, 1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  finding_id INT UNSIGNED NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  uploaded_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  finding_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  finding_id INT UNSIGNED,
  type ENUM('ASSIGNED', 'UPDATED', 'COMMENTED', 'CLOSED', 'SYSTEM') NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Standards table
CREATE TABLE IF NOT EXISTS standards (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code_name VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  issuing_body VARCHAR(255) NOT NULL,
  effective_date DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Sections table (hierarchical structure)
CREATE TABLE IF NOT EXISTS standard_sections (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  standard_id INT UNSIGNED NOT NULL,
  section_number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  parent_section_id INT UNSIGNED,
  content TEXT,
  has_tables BOOLEAN DEFAULT FALSE,
  has_figures BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (standard_id) REFERENCES standards(id),
  FOREIGN KEY (parent_section_id) REFERENCES standard_sections(id) ON DELETE SET NULL
);

-- Tables in standards
CREATE TABLE IF NOT EXISTS standard_tables (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  section_id INT UNSIGNED NOT NULL,
  table_number VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content JSON NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES standard_sections(id) ON DELETE CASCADE
);

-- Reports table - stores metadata about generated reports
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('energy_audit', 'lighting', 'hvac', 'equipment', 'power_factor', 'harmonic', 'schedule_of_loads', 'custom') NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_template BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  version INT DEFAULT 1,
  status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Report content table - stores the actual content/components of the report
CREATE TABLE IF NOT EXISTS report_contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  content_type ENUM('text', 'chart', 'table', 'image', 'section_header', 'page_break', 'toc', 'custom') NOT NULL,
  content JSON NOT NULL, -- Stores the actual content data in JSON format
  order_index INT NOT NULL, -- For ordering components within the report
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Energy Audits table
CREATE TABLE IF NOT EXISTS energy_audits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('draft', 'in_progress', 'completed', 'archived') DEFAULT 'draft',
  client_id INT,
  facility_id INT,
  audit_date DATE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create default admin user
INSERT INTO users (username, email, password, first_name, last_name, role)
VALUES ('admin', 'admin@example.com', '$2b$10$PxmKCQE.u5.wwXWW7S4Vv.JG/LGaPFWZc2E6WIh90boBkFUGP1XQm', 'System', 'Admin', 'admin'); 