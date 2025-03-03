
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Info } from "lucide-react"

type StatusCardProps = {
  status: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  className?: string
}

const StatusCard = ({ status, title, description, className }: StatusCardProps) => {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }
  
  const getBgColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20'
      case 'error':
        return 'bg-red-500/10 border-red-500/20'
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/20' 
      case 'info':
      default:
        return 'bg-blue-500/10 border-blue-500/20'
    }
  }
  
  return (
    <Card className={`${getBgColor()} ${className}`}>
      <CardContent className="pt-6 flex items-start gap-4">
        {getIcon()}
        <div>
          <h3 className="font-medium text-white">{title}</h3>
          {description && <p className="text-gray-400 text-sm mt-1">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export default StatusCard
