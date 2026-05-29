import TabTransport from './TabTransport'
import TabLibrary from './TabLibrary'

export default function TabServices({ student }) {
  return (
    <div className="space-y-10">
      <TabTransport student={student} />
      <div className="border-t border-gray-100" />
      <TabLibrary student={student} />
    </div>
  )
}
