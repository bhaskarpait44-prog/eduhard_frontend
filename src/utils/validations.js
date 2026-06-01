// src/utils/validations.js
// Zod schemas for all forms — imported by React Hook Form pages

import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter email or admission number'),
  password: z.string().min(1, 'Password is required'),
  remember: z.boolean().optional(),
})

// ── Shared Fields ────────────────────────────────────────────────────────
export const phoneSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number')
  .optional()
  .or(z.literal(''))

export const pincodeSchema = z.string()
  .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode')
  .optional()
  .or(z.literal(''))

// ── Student Admission ─────────────────────────────────────────────────────
export const studentAdmitSchema = z.object({
  first_name   : z.string().min(1, 'First name is required'),
  last_name    : z.string().min(1, 'Last name is required'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender       : z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),
  admission_no : z.string().min(1, 'Admission number is required'),
})

export const studentProfileSchema = z.object({
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: pincodeSchema,
  phone: phoneSchema,
  email: z.string().email('A valid student email is required'),
  father_name: z.string().optional(),
  father_phone: phoneSchema,
  father_email: z.string().email('A valid parent email is required for login access').optional().or(z.literal('')),
  mother_name: z.string().optional(),
  mother_phone: phoneSchema,
  mother_email: z.string().email('A valid parent email is required').optional().or(z.literal('')),
  emergency_contact: phoneSchema,
  blood_group: z.string().optional(),
  medical_notes: z.string().optional(),
})

// ── Student Profile Updates (TabProfile) ──────────────────────────────────
export const studentUpdateSchema = studentProfileSchema.extend({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string().trim().min(1, 'Last name is required'),
  parent_email: z.string().trim().email('Valid parent email is required'),
  change_reason: z.string().trim().min(10, 'Reason for change is required (min 10 chars)'),
})

// ── Teacher ───────────────────────────────────────────────────────────────
export const teacherSchema = z.object({
  name:                   z.string().trim().min(1, 'Teacher name is required'),
  email:                  z.string().trim().email('Valid email is required'),
  phone:                  phoneSchema,
  employee_id:            z.string().trim().optional(),
  department:             z.string().trim().optional(),
  designation:            z.string().trim().optional(),
  joining_date:           z.string().optional(),
  highest_qualification:  z.string().trim().optional(),
  specialization:         z.string().trim().optional(),
  university_name:        z.string().trim().optional(),
  graduation_year:        z.string().trim().optional(),
  years_of_experience:    z.string().trim().optional(),
  address:                z.string().trim().optional(),
  internal_notes:         z.string().trim().optional(),
})

// ── User Management ───────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: phoneSchema,
  role: z.enum(['admin', 'teacher', 'accountant', 'student', 'librarian', 'staff', 'receptionist', 'parent']),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  joining_date: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.preprocess(
    (value) => (value === '' || value == null ? undefined : value),
    z.enum(['male', 'female', 'other']).optional()
  ),
  address: z.string().optional(),
  auto_password: z.boolean().optional(),
  force_password_change: z.boolean().optional(),
  password: z.string().optional().refine(val => !val || val.length >= 8, {
    message: 'Password must be at least 8 characters'
  }),
  internal_notes: z.string().optional(),
})

// ── Health ────────────────────────────────────────────────────────────────
export const healthProfileSchema = z.object({
  blood_group: z.string().optional().or(z.literal('')),
  height_cm: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().positive().optional()),
  weight_kg: z.preprocess((val) => (val === '' ? undefined : Number(val)), z.number().positive().optional()),
  allergies: z.string().optional().or(z.literal('')),
  medical_conditions: z.string().optional().or(z.literal('')),
})

export const vaccinationSchema = z.object({
  vaccine_name: z.string().trim().min(1, 'Vaccine name is required'),
  date_administered: z.string().optional().or(z.literal('')),
  next_due_date: z.string().optional().or(z.literal('')),
  remarks: z.string().optional().or(z.literal('')),
})

export const incidentSchema = z.object({
  type: z.enum(['injury', 'illness', 'other']),
  incident_date: z.string().refine(d => !d || new Date(d) <= new Date(), 'Date cannot be in the future'),
  incident_time: z.string().optional().or(z.literal('')),
  description: z.string().trim().min(10, 'Describe the incident (at least 10 chars)'),
  action_taken: z.string().optional().or(z.literal('')),
})

// ── Fee payment ───────────────────────────────────────────────────────────
export const paymentSchema = z.object({
  amount          : z.string().min(1, 'Amount is required')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Enter a valid amount'),
  payment_mode    : z.enum(['cash','online','upi','cheque','dd'], { required_error: 'Select payment mode' }),
  payment_date    : z.string().min(1, 'Payment date is required'),
  transaction_ref : z.string().optional(),
})

// ── Session ───────────────────────────────────────────────────────────────
export const sessionSchema = z.object({
  name      : z.string().min(1, 'Session name is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date  : z.string().min(1, 'End date is required'),
}).refine((d) => new Date(d.end_date) > new Date(d.start_date), {
  message: 'End date must be after start date',
  path   : ['end_date'],
})
