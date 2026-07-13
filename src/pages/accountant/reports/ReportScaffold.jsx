import { Row, Col, Table, Alert, Spin } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { formatCurrency, formatDate } from '@/utils/helpers'
import PageHeader from '@/components/ui/PageHeader'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import Badge from '@/components/ui/Badge'

const ReportScaffold = ({ title, data, rowsKey = 'transactions', columns = [], isLoading = false, error = null, actions = null }) => {
  const rows = data?.[rowsKey] || data?.days || data?.students || data?.defaulters || []
  const summaryEntries = Object.entries(data?.summary || {}).filter(([, value]) => (
    value == null || ['string', 'number', 'boolean'].includes(typeof value)
  ))

  const tableColumns = columns.map((col) => {
    const isAmt = col.key.includes('amount') || col.key.includes('balance') || col.key.includes('collection') || col.key.includes('due') || col.key.includes('paid') || col.format === 'currency'
    return {
      title: col.label,
      dataIndex: col.key,
      key: col.key,
      align: isAmt ? 'right' : 'left',
      render: (val) => {
        if (isAmt) {
          return (
            <span className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>
              {formatCurrency(Number(val) || 0)}
            </span>
          )
        }
        if (col.format === 'date') {
          return <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(val)}</span>
        }
        return <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{val}</span>
      },
    }
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        subtitle="Generated collection and transaction analysis logs"
        action={
          <div className="flex items-center gap-2">
            <Badge variant="blue">Report</Badge>
            {actions}
          </div>
        }
      />

      {error && (
        <Alert
          type="error"
          showIcon
          message="Report could not be loaded"
          description={error}
        />
      )}

      {/* Summary statistics */}
      {summaryEntries.length > 0 && (
        <Row gutter={[16, 16]}>
          {summaryEntries.slice(0, 6).map(([key, value]) => (
            <Col xs={24} sm={12} md={8} key={key}>
              <StatCard
                label={key.replace(/_/g, ' ')}
                value={typeof value === 'number' && value > 999 ? formatCurrency(value) : String(value)}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Data Table */}
      <Card title={`${title} Data`}>
        <div className="-mx-5 -mb-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spin size="large" />
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center" style={{ color: 'var(--color-text-muted)' }}>
              <FileTextOutlined style={{ fontSize: 32, opacity: 0.3, display: 'block', marginBottom: 8 }} />
              <p className="text-sm">No report data available</p>
            </div>
          ) : (
            <Table
              dataSource={rows}
              columns={tableColumns}
              rowKey={(record) => record.id || record.student_id || record.date || Math.random()}
              pagination={{ pageSize: 20 }}
              size="small"
              rowClassName="transition-colors"
            />
          )}
        </div>
      </Card>
    </div>
  )
}

export default ReportScaffold
