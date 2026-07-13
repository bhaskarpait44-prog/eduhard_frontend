// src/utils/feeStatus.js
// Unified fee/payment status → Badge variant mapping.
// Use this everywhere instead of ad-hoc color objects per page.

/**
 * Maps a fee or payment status string to a Badge variant.
 * @param {string} status
 * @returns {'green'|'yellow'|'red'|'blue'|'grey'|'dark'}
 */
export const feeStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'green'
    case 'partial':
      return 'yellow'
    case 'unpaid':
      return 'red'
    case 'overdue':
      return 'red'
    case 'pending':
      return 'yellow'
    case 'submitted':
      return 'blue'
    case 'approved':
      return 'green'
    case 'rejected':
      return 'red'
    case 'cancelled':
      return 'grey'
    case 'refunded':
      return 'blue'
    case 'processing':
      return 'blue'
    case 'generated':
      return 'grey'
    case 'active':
      return 'green'
    case 'inactive':
      return 'grey'
    default:
      return 'grey'
  }
}

/**
 * Maps a payment mode string to a Badge variant.
 * @param {string} mode
 * @returns {'green'|'yellow'|'red'|'blue'|'grey'|'dark'}
 */
export const paymentModeBadge = (mode) => {
  switch (mode?.toLowerCase()) {
    case 'cash':
      return 'green'
    case 'online':
      return 'blue'
    case 'cheque':
      return 'yellow'
    case 'card':
      return 'grey'
    case 'upi':
      return 'blue'
    case 'dd':
      return 'grey'
    case 'bank transfer':
      return 'blue'
    default:
      return 'grey'
  }
}

/**
 * Maps an expense category string to a Badge variant.
 * @param {string} category
 * @returns {'green'|'yellow'|'red'|'blue'|'grey'|'dark'}
 */
export const expenseCategoryBadge = (category) => {
  switch (category?.toLowerCase()) {
    case 'salary':
      return 'green'
    case 'maintenance':
      return 'yellow'
    case 'utilities':
      return 'blue'
    case 'supplies':
      return 'grey'
    case 'events':
      return 'blue'
    case 'misc':
    default:
      return 'dark'
  }
}
