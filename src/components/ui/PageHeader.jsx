import { cn } from '@/utils/helpers'

/**
 * A standard header for internal pages.
 * 
 * @param {String} title - Main title
 * @param {String} subtitle - Optional description
 * @param {Element} icon - Optional Lucide icon
 * @param {Element} action - Optional action (e.g. Button)
 */
const PageHeader = ({ title, subtitle, icon: Icon, action, className }) => {
  return (
    <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4", className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="h-12 w-12 rounded-2xl bg-primary-soft flex items-center justify-center text-primary shrink-0 shadow-sm border border-primary/10">
            <Icon size={24} strokeWidth={2.5} />
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          <h1 className="text-2xl font-black text-text-primary tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm font-medium text-text-muted tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {action && (
        <div className="flex items-center gap-3 shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

export default PageHeader
