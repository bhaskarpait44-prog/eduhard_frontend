import {
  Card,
  Row,
  Col,
  Table,
  ConfigProvider,
  Statistic,
  Tag,
  Alert,
  Spin,
  theme as antdTheme
} from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { formatCurrency, formatDate } from '@/utils/helpers'
import useUiStore from '@/store/uiStore'

const ReportScaffold = ({ title, data, rowsKey = 'transactions', columns = [], isLoading = false, error = null, actions = null }) => {
  const { theme: storeTheme } = useUiStore()
  const rows = data?.[rowsKey] || data?.days || data?.students || data?.defaulters || []
  const summaryEntries = Object.entries(data?.summary || {}).filter(([, value]) => (
    value == null || ['string', 'number', 'boolean'].includes(typeof value)
  ))

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

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
            <span className="font-extrabold text-green-600 dark:text-green-400">
              {formatCurrency(Number(val) || 0)}
            </span>
          )
        }
        if (col.format === 'date') {
          return <span className="font-semibold text-gray-500 dark:text-gray-400">{formatDate(val)}</span>
        }
        return <span className="font-semibold text-gray-700 dark:text-gray-300">{val}</span>
      }
    }
  })

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4361ee',
          borderRadius: 10,
          fontFamily: 'Roboto, system-ui, sans-serif',
        },
      }}
    >
      <div className="space-y-6">
        {/* Header Block */}
        <div
          className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] border p-6 shadow-sm relative overflow-hidden backdrop-blur-md"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(67, 97, 238, 0.15) 0%, #1e1b4b 100%)'
              : 'linear-gradient(135deg, #eef2ff 0%, #fffdf9 100%)',
            borderColor: isDark ? 'rgba(67, 97, 238, 0.3)' : '#c7d2fe'
          }}
        >
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="z-10 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-600 dark:text-indigo-400">
              <FileTextOutlined className="text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h1>
                <Tag color="blue" className="font-extrabold uppercase text-[9px] border-0 px-2 rounded-full">Report</Tag>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
                Generated collection and transaction analysis logs.
              </p>
            </div>
          </div>
          {actions && <div className="z-10">{actions}</div>}
        </div>

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
                <Card className="rounded-[24px] border border-indigo-200/10 shadow-sm" styles={{ body: { padding: '20px' } }}>
                  <Statistic
                    title={<span className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 block mb-1">{key.replace(/_/g, ' ')}</span>}
                    value={value}
                    precision={typeof value === 'number' && value % 1 !== 0 ? 2 : 0}
                    formatter={(v) => typeof v === 'number' && v > 999 ? formatCurrency(v) : String(v)}
                    valueStyle={{ fontSize: '1.25rem', fontWeight: 900 }}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Data Table */}
        <Card
          className="rounded-[28px] shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden"
          styles={{ body: { padding: '0px' } }}
        >
          <Spin spinning={isLoading}>
            <Table
              dataSource={rows}
              columns={tableColumns}
              rowKey={(r, index) => r.id || r.student_id || r.date || index}
              pagination={{ pageSize: 20 }}
              size="middle"
              className="premium-table"
              rowClassName="hover:bg-orange-50/10 dark:hover:bg-orange-950/10 transition-colors"
            />
          </Spin>
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default ReportScaffold
