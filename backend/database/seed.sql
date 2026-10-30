-- Hospital Management System - sample data
-- Every demo account uses the password:  Password@123   (only the bcrypt hash is stored)
USE hospital_management;

INSERT INTO departments (id, name, description) VALUES
 (1, 'Cardiology', 'Heart and blood vessel care'),
 (2, 'Pediatrics', 'Medical care for infants, children and teenagers'),
 (3, 'Orthopedics', 'Bones, joints and muscles'),
 (4, 'General Medicine', 'Primary care and common illnesses'),
 (5, 'Dermatology', 'Skin, hair and nail conditions');

INSERT INTO users (id, name, email, password_hash, role, phone) VALUES
 (1,  'Hospital Admin',      'admin@hospital.com',        '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'admin',        '9830000001'),
 (2,  'Riya Sen',            'reception@hospital.com',    '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'receptionist', '9830000002'),
 (3,  'Arjun Das',           'billing@hospital.com',      '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'billing',      '9830000003'),
 (4,  'Anil Sharma',         'dr.sharma@hospital.com',    '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'doctor',       '9830000004'),
 (5,  'Priya Mehta',         'dr.mehta@hospital.com',     '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'doctor',       '9830000005'),
 (6,  'Sourav Roy',          'dr.roy@hospital.com',       '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'doctor',       '9830000006'),
 (7,  'Ayesha Khan',         'dr.khan@hospital.com',      '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'doctor',       '9830000007'),
 (8,  'Rahul Verma',         'patient@hospital.com',      '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'patient',      '9830000008'),
 (9,  'Sneha Patel',         'sneha.patel@example.com',   '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'patient',      '9830000009'),
 (10, 'Amit Ghosh',          'amit.ghosh@example.com',    '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'patient',      '9830000010'),
 (11, 'Meera Nair',          'meera.nair@example.com',    '$2b$10$rIsxQYQtyF23s4fbGPVG8eCVCUjCNhEGmbFCveMPgSC8.tcSbu/FW', 'patient',      '9830000011');

INSERT INTO doctors (id, user_id, department_id, specialization, qualification, consultation_fee) VALUES
 (1, 4, 1, 'Cardiologist',       'MBBS, MD (Cardiology)',     800.00),
 (2, 5, 2, 'Pediatrician',       'MBBS, DCH',                 600.00),
 (3, 6, 3, 'Orthopedic Surgeon', 'MBBS, MS (Orthopedics)',    700.00),
 (4, 7, 4, 'General Physician',  'MBBS, MD (Medicine)',       500.00);

-- Doctors are available Monday to Saturday
INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time) VALUES
 (1,'Monday','09:00','13:00'),(1,'Tuesday','09:00','13:00'),(1,'Wednesday','09:00','13:00'),(1,'Thursday','09:00','13:00'),(1,'Friday','09:00','13:00'),(1,'Saturday','09:00','13:00'),
 (2,'Monday','10:00','16:00'),(2,'Tuesday','10:00','16:00'),(2,'Wednesday','10:00','16:00'),(2,'Thursday','10:00','16:00'),(2,'Friday','10:00','16:00'),(2,'Saturday','10:00','14:00'),
 (3,'Monday','09:00','15:00'),(3,'Tuesday','09:00','15:00'),(3,'Wednesday','09:00','15:00'),(3,'Thursday','09:00','15:00'),(3,'Friday','09:00','15:00'),(3,'Saturday','09:00','13:00'),
 (4,'Monday','09:00','18:00'),(4,'Tuesday','09:00','18:00'),(4,'Wednesday','09:00','18:00'),(4,'Thursday','09:00','18:00'),(4,'Friday','09:00','18:00'),(4,'Saturday','09:00','14:00');

INSERT INTO patients (id, user_id, date_of_birth, gender, address, emergency_contact) VALUES
 (1, 8,  '1990-05-14', 'Male',   '12 Park Street, Kolkata',       'Sunita Verma (Wife) - 9831111111'),
 (2, 9,  '2018-09-02', 'Female', '45 Salt Lake Sector V, Kolkata','Kiran Patel (Father) - 9832222222'),
 (3, 10, '1975-11-23', 'Male',   '8 Gariahat Road, Kolkata',      'Ritu Ghosh (Wife) - 9833333333'),
 (4, 11, '1985-02-17', 'Female', '21 Howrah Maidan, Howrah',      'Suresh Nair (Husband) - 9834444444');

-- Appointment dates are relative to today so the demo always has past, today and upcoming data
INSERT INTO appointments (id, patient_id, doctor_id, appointment_date, appointment_time, reason, status) VALUES
 (1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), '10:00:00', 'Chest discomfort follow-up', 'Completed'),
 (2, 2, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), '11:00:00', 'Fever and cough',            'Completed'),
 (3, 3, 3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '09:30:00', 'Knee pain',                  'Completed'),
 (4, 1, 4, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:30:00', 'General check-up',           'Confirmed'),
 (5, 4, 1, DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:00:00', 'Palpitations',               'Requested'),
 (6, 2, 4, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00', 'Vaccination advice',         'Confirmed'),
 (7, 3, 1, CURDATE(),                           '16:00:00', 'Blood pressure review',      'Confirmed'),
 (8, 4, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'Child wellness visit',       'Cancelled');

INSERT INTO medical_records (id, patient_id, doctor_id, appointment_id, diagnosis, treatment_notes, record_date) VALUES
 (1, 1, 1, 1, 'Mild hypertension',        'Advised low-salt diet and daily walking. Review BP in 2 weeks.', DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
 (2, 2, 2, 2, 'Viral upper respiratory infection', 'Rest, fluids, paracetamol for fever. Return if fever lasts more than 3 days.', DATE_SUB(CURDATE(), INTERVAL 3 DAY)),
 (3, 3, 3, 3, 'Knee osteoarthritis (early)', 'Physiotherapy for 4 weeks. Avoid stairs where possible.', DATE_SUB(CURDATE(), INTERVAL 2 DAY));

INSERT INTO prescriptions (id, patient_id, doctor_id, appointment_id, prescription_date, notes) VALUES
 (1, 1, 1, 1, DATE_SUB(CURDATE(), INTERVAL 5 DAY), 'Take medicines after meals'),
 (2, 2, 2, 2, DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'Plenty of fluids'),
 (3, 3, 3, 3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Physiotherapy referral given');

INSERT INTO prescription_items (prescription_id, medicine_name, dosage, frequency, duration, instructions) VALUES
 (1, 'Amlodipine',   '5 mg',   'Once daily',        '14 days', 'Take in the morning'),
 (1, 'Aspirin',      '75 mg',  'Once daily',        '14 days', 'After lunch'),
 (2, 'Paracetamol',  '250 mg', 'Every 6 hours',     '3 days',  'Only if fever is above 100F'),
 (2, 'Cetirizine',   '5 mg',   'Once at night',     '5 days',  NULL),
 (3, 'Diclofenac gel','Apply thin layer','Twice daily','10 days','Apply on the affected knee'),
 (3, 'Calcium + Vitamin D3','1 tablet','Once daily','30 days', 'After dinner');

-- Invoice 1 fully paid, invoice 2 partly paid. Appointment 3 is completed but not billed yet.
INSERT INTO invoices (id, patient_id, appointment_id, consultation_charge, other_charges, other_charges_description, total_amount, amount_paid, status) VALUES
 (1, 1, 1, 800.00, 200.00, 'ECG', 1000.00, 1000.00, 'Paid'),
 (2, 2, 2, 600.00, 150.00, 'Nebulization', 750.00, 300.00, 'Partially Paid');

INSERT INTO payments (id, invoice_id, amount, method, recorded_by) VALUES
 (1, 1, 1000.00, 'UPI',  3),
 (2, 2, 300.00,  'Cash', 3);

INSERT INTO notifications (user_id, message, type) VALUES
 (8,  'Your appointment with Dr. Ayesha Khan is confirmed.', 'appointment_confirmed'),
 (8,  'Invoice #1 has been paid in full. Thank you.', 'payment'),
 (4,  'New appointment request from Meera Nair.', 'appointment_booked'),
 (2,  'Meera Nair requested an appointment with Dr. Anil Sharma.', 'appointment_booked');
