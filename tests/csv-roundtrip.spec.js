import { test, expect } from '@playwright/test'
import Papa from 'papaparse'

function parseCSV(text) {
  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim().replace(/^"(.*)"$/, '$1').toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
  })
  return result.data
}

test.describe('CSV Parser Round-Trip & Comma Escaping', () => {
  test('should correctly unparse and parse fields containing commas without shifting columns', () => {
    const columns = [
      { key: 'first_name', example: 'Rahul' },
      { key: 'address', example: '123 Main St, Jorhat' },
      { key: 'blood_group', example: 'O+' }
    ]

    const headerRow = columns.map(c => c.key)
    const exampleRow = columns.map(c => c.example ?? '')

    // Unparse (generates CSV with quoted fields where commas exist)
    const csv = Papa.unparse({
      fields: headerRow,
      data: [exampleRow]
    })

    // Assert that the address field containing a comma is wrapped in double quotes
    expect(csv).toContain('"123 Main St, Jorhat"')

    // Parse back
    const parsed = parseCSV(csv)

    expect(parsed).toHaveLength(1)
    expect(parsed[0].first_name).toBe('Rahul')
    expect(parsed[0].address).toBe('123 Main St, Jorhat')
    expect(parsed[0].blood_group).toBe('O+')
  })
})
