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
  first_name: z
    .string()
    .trim()
    .min(2, 'First name must be at least 2 characters')
    .regex(/^[a-zA-Z\s''-]+$/, 'First name can only contain letters, spaces, hyphens and apostrophes'),

  last_name: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .regex(/^[a-zA-Z\s''-]+$/, 'Last name can only contain letters, spaces, hyphens and apostrophes'),

  date_of_birth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine(val => new Date(val) <= new Date(), 'Date of birth cannot be in the future')
    .refine(val => {
      const age = (new Date() - new Date(val)) / (1000 * 60 * 60 * 24 * 365.25)
      return age >= 3
    }, 'Student must be at least 3 years old'),

  gender: z.enum(['male', 'female', 'other'], { required_error: 'Gender is required' }),

  admission_no: z
    .string()
    .trim()
    .min(1, 'Admission number is required')
    .max(30, 'Admission number is too long')
    .regex(/^[a-zA-Z0-9\-_/]+$/, 'Admission number can only contain letters, numbers, hyphens, underscores and slashes'),

  aadhar_no: z
    .string()
    .regex(/^\d{12}$/, 'Aadhar must be exactly 12 digits')
    .optional()
    .or(z.literal('')),
})

export const studentProfileSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z
    .string()
    .min(1, 'Pincode is required')
    .regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  phone: phoneSchema,
  email: z.string().email('A valid student email is required').optional().or(z.literal('')),

  // SVA Expansion
  village: z.string().min(1, 'Village is required'),
  police_station: z.string().min(1, 'Police station is required'),
  post_office: z.string().min(1, 'Post office is required'),
  district: z.string().min(1, 'District is required'),
  whatsapp_no: phoneSchema,
  nationality: z.string().min(1, 'Nationality is required'),
  religion: z.string().min(1, 'Religion is required'),
  caste: z.enum(['OBC', 'ST', 'SC', 'Gen'], { required_error: 'Caste is required' }),
  mother_tongue: z.string().min(1, 'Mother tongue is required'),
  identification_marks: z.string().optional(),
  is_hostel: z.boolean().optional(),
  medium: z.enum(['English', 'Assamese']).optional(),
  pen_no: z.string().optional(),
  apaar_id: z.string().optional(),
  prev_attendance_days: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().int().nonnegative().optional()),
  distance_km: z.preprocess((val) => (val === '' || val === null ? undefined : Number(val)), z.number().nonnegative().optional()),

  // Permanent Address
  is_permanent_same: z.boolean().optional().default(false),
  perm_address: z.string().optional(),
  perm_village: z.string().optional(),
  perm_police_station: z.string().optional(),
  perm_post_office: z.string().optional(),
  perm_district: z.string().optional(),
  perm_city: z.string().optional(),
  perm_state: z.string().optional(),
  perm_pincode: pincodeSchema,

  father_name: z.string().min(1, "Father's name is required"),
  father_phone: phoneSchema,
  father_email: z.string().email('A valid parent email is required'),
  father_occupation: z.string().optional(),
  father_qualification: z.string().optional(),
  father_aadhar: z
    .string()
    .regex(/^\d{12}$/, "Father's Aadhar must be exactly 12 digits")
    .optional()
    .or(z.literal('')),
  father_annual_income: z.string().optional(),

  mother_name: z.string().min(1, "Mother's name is required"),
  mother_phone: phoneSchema,
  mother_qualification: z.string().optional(),
  mother_email: z.string().email('Valid email required').optional().or(z.literal('')),

  guardian_name: z.string().optional(),
  guardian_relation: z.string().optional(),
  guardian_phone: phoneSchema,
  guardian_occupation: z.string().optional(),
  guardian_qualification: z.string().optional(),
  guardian_aadhar: z
    .string()
    .regex(/^\d{12}$/, "Guardian's Aadhar must be exactly 12 digits")
    .optional()
    .or(z.literal('')),
  guardian_annual_income: z.string().optional(),

  emergency_contact: z
    .string()
    .min(1, 'Emergency contact is required')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  blood_group: z.enum(
    ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    { required_error: 'Blood group is required' }
  ),
  medical_notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.is_permanent_same) {
    if (!data.perm_address) ctx.addIssue({ code: 'custom', message: 'Permanent address is required', path: ['perm_address'] });
    if (!data.perm_village) ctx.addIssue({ code: 'custom', message: 'Permanent village is required', path: ['perm_village'] });
    if (!data.perm_police_station) ctx.addIssue({ code: 'custom', message: 'Permanent police station is required', path: ['perm_police_station'] });
    if (!data.perm_post_office) ctx.addIssue({ code: 'custom', message: 'Permanent post office is required', path: ['perm_post_office'] });
    if (!data.perm_district) ctx.addIssue({ code: 'custom', message: 'Permanent district is required', path: ['perm_district'] });
    if (!data.perm_state) ctx.addIssue({ code: 'custom', message: 'Permanent state is required', path: ['perm_state'] });
    if (!data.perm_pincode || !/^\d{6}$/.test(data.perm_pincode)) ctx.addIssue({ code: 'custom', message: 'Valid permanent pincode is required', path: ['perm_pincode'] });
  }

  // At least one parent phone must be provided
  if (!data.father_phone && !data.mother_phone) {
    ctx.addIssue({
      code: 'custom',
      message: "At least one parent's phone number is required",
      path: ['father_phone'],
    })
    ctx.addIssue({
      code: 'custom',
      message: "At least one parent's phone number is required",
      path: ['mother_phone'],
    })
  }
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
