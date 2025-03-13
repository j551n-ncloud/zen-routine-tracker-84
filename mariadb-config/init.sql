
-- Create tables for ZenTracker

-- Table for generic key-value pairs
CREATE TABLE IF NOT EXISTS key_value_store (
  `key` VARCHAR(255) PRIMARY KEY,
  `value` TEXT NOT NULL
);

-- Table for habits
CREATE TABLE IF NOT EXISTS habits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  streak INT DEFAULT 0,
  completed BOOLEAN DEFAULT 0,
  category VARCHAR(255),
  icon VARCHAR(255)
);

-- Table for daily habit status
CREATE TABLE IF NOT EXISTS daily_habits (
  date DATE,
  habit_id INT,
  completed BOOLEAN DEFAULT 0,
  PRIMARY KEY (date, habit_id),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

-- Table for tasks
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  priority ENUM('high', 'medium', 'low'),
  completed BOOLEAN DEFAULT 0,
  start_date DATE,
  due_date DATE NOT NULL
);

-- Table for calendar data
CREATE TABLE IF NOT EXISTS calendar_data (
  date DATE PRIMARY KEY,
  data TEXT NOT NULL
);

-- Table for users
CREATE TABLE IF NOT EXISTS users (
  username VARCHAR(255) PRIMARY KEY,
  password VARCHAR(255) NOT NULL,
  is_admin BOOLEAN DEFAULT 0
);

-- Insert default admin user
INSERT INTO users (username, password, is_admin) 
VALUES ('admin', 'admin', 1)
ON DUPLICATE KEY UPDATE username=username;
