-- Seed Data for Leave Management System

-- Insert departments
INSERT INTO departments (name, description) VALUES
('Engineering', 'Software development and infrastructure'),
('HR', 'Human resources and recruitment'),
('Finance', 'Financial planning and accounting'),
('Marketing', 'Marketing and brand management'),
('Operations', 'Business operations and logistics'),
('Sales', 'Sales and business development')
ON CONFLICT (name) DO NOTHING;

-- Insert leave types
INSERT INTO leave_types (name, description, max_days_per_year) VALUES
('Annual Leave', 'Standard annual vacation days', 20),
('Sick Leave', 'For personal illness and medical appointments', 10),
('Casual Leave', 'For personal requirements and emergencies', 5),
('Maternity Leave', 'For mothers after childbirth', 90),
('Paternity Leave', 'For fathers after childbirth', 14),
('Compassionate Leave', 'For bereavement and family emergencies', 3)
ON CONFLICT (name) DO NOTHING;

-- Insert admin user (password: Admin@123)
-- bcrypt hash of "Admin@123" using cost 10
INSERT INTO users (id, employee_id, full_name, email, password_hash, role, is_active) VALUES
('u-admin', 'EMP001', 'Admin User', 'admin@company.com', '$2a$10$ToySuABZ9UQbYEgvkdGa.e.08Xt9llQC/MW2xqq7QEzzap2iphsHK', 'admin', TRUE)
ON CONFLICT (id) DO UPDATE SET
	employee_id = EXCLUDED.employee_id,
	full_name = EXCLUDED.full_name,
	email = EXCLUDED.email,
	password_hash = EXCLUDED.password_hash,
	role = EXCLUDED.role,
	is_active = EXCLUDED.is_active;

-- Insert manager user (password: Manager@123)
-- bcrypt hash of "Manager@123" using cost 10
INSERT INTO users (id, employee_id, full_name, email, password_hash, role, department_id, position, is_active) VALUES
('u-manager', 'EMP002', 'Manager User', 'manager@company.com', '$2a$10$eV7LUPVNQO/sv5YD/zDExeB3Zoz7WqgntiJYV1ufnxEJw6fYsc.ce', 'manager', 1, 'Team Lead', TRUE)
ON CONFLICT (id) DO UPDATE SET
	employee_id = EXCLUDED.employee_id,
	full_name = EXCLUDED.full_name,
	email = EXCLUDED.email,
	password_hash = EXCLUDED.password_hash,
	role = EXCLUDED.role,
	department_id = EXCLUDED.department_id,
	position = EXCLUDED.position,
	is_active = EXCLUDED.is_active;

-- Insert employee user (password: Employee@123)
-- bcrypt hash of "Employee@123" using cost 10
INSERT INTO users (id, employee_id, full_name, email, password_hash, role, department_id, position, is_active) VALUES
('u-employee', 'EMP003', 'Employee User', 'employee@company.com', '$2a$10$x84gzNp8LmssYPig0T1dCuq8HzQjc9IwMn4Ls5k/2mXU5ycvxD0ki', 'employee', 1, 'Software Engineer', TRUE)
ON CONFLICT (id) DO UPDATE SET
	employee_id = EXCLUDED.employee_id,
	full_name = EXCLUDED.full_name,
	email = EXCLUDED.email,
	password_hash = EXCLUDED.password_hash,
	role = EXCLUDED.role,
	department_id = EXCLUDED.department_id,
	position = EXCLUDED.position,
	is_active = EXCLUDED.is_active;

-- Initialize leave balances for admin user for current year (2026)
INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days) 
SELECT 'u-admin', id, 2026, max_days_per_year, 0
FROM leave_types
ON CONFLICT (user_id, leave_type_id, year) DO NOTHING;

-- Initialize leave balances for manager user for current year (2026)
INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days) 
SELECT 'u-manager', id, 2026, max_days_per_year, 0
FROM leave_types
ON CONFLICT (user_id, leave_type_id, year) DO NOTHING;

-- Initialize leave balances for employee user for current year (2026)
INSERT INTO leave_balances (user_id, leave_type_id, year, total_days, used_days) 
SELECT 'u-employee', id, 2026, max_days_per_year, 0
FROM leave_types
ON CONFLICT (user_id, leave_type_id, year) DO NOTHING;

-- Sample leave requests for testing
INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason, status)
SELECT 'u-employee', id, '2026-04-10', '2026-04-12', 'Family vacation', 'pending'
FROM leave_types WHERE name = 'Annual Leave'
ON CONFLICT DO NOTHING;

INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, reason, status, reviewed_by, reviewed_at)
SELECT 'u-employee', id, '2026-03-15', '2026-03-17', 'Personal work', 'approved', 'u-manager', NOW()
FROM leave_types WHERE name = 'Casual Leave'
ON CONFLICT DO NOTHING;

-- Log seed completion
SELECT '✓ Seed data loaded successfully' AS status;
