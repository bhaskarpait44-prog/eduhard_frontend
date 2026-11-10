import TabTransport from './TabTransport'
import TabLibrary from './TabLibrary'

export default function TabServices({ student }) {
  return (
    <div className="space-y-10">
      <TabTransport student={student} />
      <div className="border-t border-gray-100 dark:border-gray-800" />
      <TabLibrary student={student} />
    </div>
  )
}
