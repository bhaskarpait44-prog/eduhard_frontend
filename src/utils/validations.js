// src/utils/validations.js
// Zod schemas for all forms — imported by React Hook Form pages

import { z } from 'zod'

// ── Auth ──────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is missing — please enter your email or admission number'),
  password: z.string().min(1, 'Password is missing — please enter your password'),
  remember: z.boolean().optional(),
})

// ── Shared Fields ────────────────────────────────────────────────────────
export const phoneSchema = z.string()
  .regex(/^[6-9]\d{9}$/, 'Phone number is invalid — enter a valid 10-digit mobile number starting with 6, 7, 8, or 9')
  .optional()
  .or(z.literal(''))

export const pincodeSchema = z.string()
  .regex(/^\d{6}$/, 'PIN code is invalid — please enter exactly 6 digits')
  .optional()
  .or(z.literal(''))

// ── Student Admission ─────────────────────────────────────────────────────
export const studentAdmitSchema = z.object({
  first_name: z
    .string().trim()
    .min(2, 'First name is too short — please enter at least 2 characters')
    .max(50, 'First name is too long — please limit to 50 characters')
    .regex(/^[a-zA-Z\s''-]+$/, 'First name contains invalid characters — only letters, spaces, hyphens, and apostrophes are allowed'),

  last_name: z
    .string().trim()
    .min(1, 'Last name is missing — please enter the student\'s last name')
    .max(50, 'Last name is too long — please limit to 50 characters')
    .regex(/^[a-zA-Z\s''-]+$/, 'Last name contains invalid characters — only letters, spaces, hyphens, and apostrophes are allowed'),

  date_of_birth: z
    .string()
    .min(1, 'Date of birth is missing — please enter the student\'s date of birth')
    .refine(val => !isNaN(Date.parse(val)), 'Date format is invalid — please enter a valid date (YYYY-MM-DD)')
    .refine(val => new Date(val) < new Date(), 'Date of birth is invalid — the date cannot be today or in the future')
    .refine(val => {
      const age = (Date.now() - new Date(val)) / (1000 * 60 * 60 * 24 * 365.25)
      return age >= 3
    }, 'Student is too young — the student must be at least 3 years old to be admitted')
    .refine(val => {
      const age = (Date.now() - new Date(val)) / (1000 * 60 * 60 * 24 * 365.25)
      return age <= 100
    }, 'Date of birth is suspicious — please check the year (maximum age is 100)'),

  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Gender is required — please select an option from the list',
    invalid_type_error: 'Gender selection is invalid — please select a valid option',
  }),

  admission_no: z
    .string().trim()
    .min(1, 'Admission number is missing — please enter a unique admission number')
    .max(30, 'Admission number is too long — please limit to 30 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Admission number contains invalid characters — only letters, numbers, hyphens, and underscores are allowed'),

  aadhar_no: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits — enter numbers only, no spaces')
    .optional()
    .or(z.literal('')),
})

// ── Student Profile (Base Object) ──────────────────────────────────────────
// NOTE: We define the base object separately so we can .extend() it.
// Zod does not allow extending schemas that already have .superRefine() or .refine().
const baseStudentProfileSchema = z.object({
  address: z.string().min(1, 'Address is missing — please enter the house number, street, and locality'),
  city: z.string().min(1, 'City is missing — please enter the city or town name'),
  state: z.string().min(1, 'State is missing — please enter the state'),
  pincode: z
    .string()
    .min(1, 'PIN code is missing — please enter exactly 6 digits')
    .regex(/^\d{6}$/, 'PIN code is invalid — please enter exactly 6 digits'),
  phone: phoneSchema,
  email: z.string().email('Email is invalid — please enter a valid email address (Optional)').optional().or(z.literal('')),

  // SVA Expansion
  village: z.string().min(1, 'Village/Town is missing — please enter the village or town name'),
  police_station: z.string().min(1, 'Police station is missing — please enter the nearest police station name'),
  post_office: z.string().min(1, 'Post office is missing — please enter the nearest post office name'),
  district: z.string().min(1, 'District is missing — please enter the district name'),
  nationality: z.string().min(1, 'Nationality is missing — please enter a nationality (e.g., Indian)'),
  religion: z.string().min(1, 'Religion is missing — please select an option from the list'),
  caste: z.enum(['OBC', 'ST', 'SC', 'Gen'], { required_error: 'Caste is missing — please select an option from the list' }),
  mother_tongue: z.string().min(1, 'Mother tongue is missing — please enter the primary language spoken at home'),
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

  father_name: z.string().min(1, 'Father\'s name is missing — please enter the father\'s full name'),
  father_phone: z.string()
    .min(1, 'Father\'s phone is missing — please enter a valid 10-digit mobile number')
    .regex(/^[6-9]\d{9}$/, 'Father\'s phone is invalid — enter a valid 10-digit mobile number starting with 6, 7, 8, or 9'),
  parent_email: z.string().email('Father\'s email is invalid — enter a valid email address to be used for parent portal login'),
  father_occupation: z.string().optional(),
  father_qualification: z.string().optional(),
  father_aadhar: z
    .string()
    .regex(/^\d{12}$/, 'Father\'s Aadhaar number is invalid — enter exactly 12 digits (numbers only)')
    .optional()
    .or(z.literal('')),
  father_annual_income: z.preprocess(
    val => (val === '' || val === null || val === undefined ? undefined : String(val).replace(/,/g, '')),
    z.string().regex(/^\d+$/, 'Annual income is invalid — enter numbers only without commas or symbols (Optional)').optional()
  ),

  mother_name: z.string().min(1, 'Mother\'s name is missing — please enter the mother\'s full name'),
  mother_phone: phoneSchema,
  mother_qualification: z.string().optional(),
  mother_email: z.string().email('Mother\'s email is invalid — please enter a valid email address (Optional)').optional().or(z.literal('')),
  mother_aadhar: z
    .string()
    .regex(/^\d{12}$/, 'Mother\'s Aadhaar number is invalid — enter exactly 12 digits (numbers only) (Optional)')
    .optional()
    .or(z.literal('')),
  mother_annual_income: z.preprocess(
    val => (val === '' || val === null || val === undefined ? undefined : String(val).replace(/,/g, '')),
    z.string().regex(/^\d+$/, 'Annual income is invalid — enter numbers only without commas or symbols (Optional)').optional()
  ),
  mother_occupation: z.string().optional(),

  guardian_name: z.string().optional(),
  guardian_relation: z.string().optional(),
  guardian_phone: phoneSchema,
  guardian_occupation: z.string().optional(),
  guardian_qualification: z.string().optional(),
  guardian_aadhar: z
    .string()
    .regex(/^\d{12}$/, 'Guardian\'s Aadhaar number is invalid — enter exactly 12 digits (numbers only) (Optional)')
    .optional()
    .or(z.literal('')),

  emergency_contact: z
    .string()
    .min(1, 'Emergency contact is missing — enter a valid 10-digit mobile number')
    .regex(/^[6-9]\d{9}$/, 'Emergency contact is invalid — enter a valid 10-digit mobile number starting with 6, 7, 8, or 9'),
  blood_group: z.enum(
    ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    { required_error: 'Blood group is missing — please select a blood group from the list' }
  ),
  medical_notes: z.string().optional(),
})

// Shared refinement logic for student profile forms
const applyProfileRefinements = (data, ctx) => {
  if (!data.is_permanent_same) {
    if (!data.perm_address) ctx.addIssue({ code: 'custom', message: 'Permanent address is missing — please enter the house number and street', path: ['perm_address'] });
    if (!data.perm_village) ctx.addIssue({ code: 'custom', message: 'Permanent village is missing — please enter the village or town name', path: ['perm_village'] });
    if (!data.perm_police_station) ctx.addIssue({ code: 'custom', message: 'Permanent police station is missing — please enter the police station name', path: ['perm_police_station'] });
    if (!data.perm_post_office) ctx.addIssue({ code: 'custom', message: 'Permanent post office is missing — please enter the post office name', path: ['perm_post_office'] });
    if (!data.perm_district) ctx.addIssue({ code: 'custom', message: 'Permanent district is missing — please enter the district name', path: ['perm_district'] });
    if (!data.perm_city) ctx.addIssue({ code: 'custom', message: 'Permanent city / town is missing — please enter the city or town name', path: ['perm_city'] });
    if (!data.perm_state) ctx.addIssue({ code: 'custom', message: 'Permanent state is missing — please enter the state', path: ['perm_state'] });
    if (!data.perm_pincode || !/^\d{6}$/.test(data.perm_pincode)) ctx.addIssue({ code: 'custom', message: 'Permanent PIN code is invalid — please enter exactly 6 digits', path: ['perm_pincode'] });
  }

}

export const studentProfileSchema = baseStudentProfileSchema.superRefine(applyProfileRefinements)

// ── Student Profile Updates (TabProfile) ──────────────────────────────────
export const studentUpdateSchema = baseStudentProfileSchema.extend({
  first_name: z
    .string().trim()
    .min(1, 'First name is missing — please enter the student\'s first name')
    .max(50, 'First name is too long — please limit to 50 characters')
    .regex(/^[a-zA-Z\s''-]+$/, 'First name contains invalid characters — only letters are allowed'),
  last_name: z
    .string().trim()
    .min(1, 'Last name is missing — please enter the student\'s last name')
    .max(50, 'Last name is too long — please limit to 50 characters')
    .regex(/^[a-zA-Z\s''-]+$/, 'Last name contains invalid characters — only letters are allowed'),

  admission_no: z
    .string().trim()
    .min(1, 'Admission number is missing — please enter a unique admission number')
    .max(30, 'Admission number is too long — please limit to 30 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Admission number contains invalid characters — only letters, numbers, hyphens, and underscores are allowed'),



  date_of_birth: z
    .string()
    .min(1, 'Date of birth is missing — please enter the student\'s date of birth')
    .refine(val => !isNaN(Date.parse(val)), 'Date format is invalid — please enter a valid date (YYYY-MM-DD)')
    .refine(val => new Date(val) < new Date(), 'Date of birth is invalid — the date cannot be in the future')
    .refine(val => {
      const age = (Date.now() - new Date(val)) / (1000 * 60 * 60 * 24 * 365.25)
      return age >= 3 && age <= 100
    }, 'Date of birth is suspicious — student must be between 3 and 100 years old'),

  gender: z.enum(['male', 'female', 'other'], {
    required_error: 'Gender is required — please select an option from the list',
    invalid_type_error: 'Gender selection is invalid — please select a valid option',
  }),

  aadhar_no: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits — enter numbers only, no spaces')
    .optional()
    .or(z.literal('')),

  parent_email: z
    .string().trim()
    .min(1, 'Parent login email is missing — enter a valid email address for portal access')
    .email('Email is invalid — please enter a valid email address to be used as the parent portal login'),

  change_reason: z
    .string().trim()
    .min(10, 'Reason for update is too short — please enter at least 10 characters describing the changes')
    .max(500, 'Reason for update is too long — please limit to 500 characters'),
}).superRefine(applyProfileRefinements)

// ── Teacher ───────────────────────────────────────────────────────────────
export const teacherSchema = z.object({
  name:                   z.string().trim().min(1, 'Teacher name is missing — please enter the full name'),
  email:                  z.string().trim().email('Email is invalid — please enter a valid professional email address'),
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
  name: z.string().min(1, 'Name is missing — please enter the full name'),
  email: z.string().email('Email is invalid — please enter a valid email address'),
  phone: phoneSchema,
  role: z.enum(['admin', 'teacher', 'accountant', 'student', 'librarian', 'staff', 'receptionist', 'parent'], {
    errorMap: (issue, ctx) => {
      if (issue.code === 'invalid_enum_value' || issue.code === 'invalid_type_error') {
        return { message: 'Role is required — please select a role' }
      }
      return { message: ctx.defaultError }
    }
  }),
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
    message: 'Password is too short — please enter at least 8 characters'
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
  vaccine_name: z.string().trim().min(1, 'Vaccine name is missing — please enter the name of the vaccine'),
  date_administered: z.string().optional().or(z.literal('')),
  next_due_date: z.string().optional().or(z.literal('')),
  remarks: z.string().optional().or(z.literal('')),
})

export const incidentSchema = z.object({
  type: z.enum(['injury', 'illness', 'other']),
  incident_date: z.string().refine(d => !d || new Date(d) <= new Date(), 'Date is invalid — incident date cannot be in the future'),
  incident_time: z.string().optional().or(z.literal('')),
  description: z.string().trim().min(10, 'Description is too short — please enter at least 10 characters describing the incident'),
  action_taken: z.string().optional().or(z.literal('')),
})

// ── Fee payment ───────────────────────────────────────────────────────────
export const paymentSchema = z.object({
  amount          : z.string().min(1, 'Amount is missing — please enter the payment amount')
    .refine(v => !isNaN(parseFloat(v)) && parseFloat(v) > 0, 'Amount is invalid — please enter a positive numeric value'),
  payment_mode    : z.enum(['cash','online','upi','cheque','dd'], { required_error: 'Payment mode is required — please select an option from the list' }),
  payment_date    : z.string().min(1, 'Payment date is missing — please enter the date of payment'),
  transaction_ref : z.string().optional(),
})

// ── Session ───────────────────────────────────────────────────────────────
export const sessionSchema = z.object({
  name      : z.string().min(1, 'Session name is missing — please enter a name for the session'),
  start_date: z.string().min(1, 'Start date is missing — please enter the session start date'),
  end_date  : z.string().min(1, 'End date is missing — please enter the session end date'),
}).refine((d) => new Date(d.end_date) > new Date(d.start_date), {
  message: 'Session range is invalid — the end date must be after the start date',
  path   : ['end_date'],
})
