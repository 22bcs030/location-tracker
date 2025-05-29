"use client"

import { CheckCircle2, Clock, Package, Navigation, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { OrderStatus } from '@/types/delivery'

interface OrderTimelineProps {
  status: OrderStatus
  timestamps: {
    assigned?: string
    picked_up?: string
    in_transit?: string
    delivered?: string
    cancelled?: string
  }
  className?: string
}

const statusConfig = {
  assigned: {
    icon: Clock,
    label: 'Assigned',
    color: 'bg-blue-500',
    textColor: 'text-blue-500',
    description: 'Order assigned to delivery partner',
  },
  picked_up: {
    icon: Package,
    label: 'Picked Up',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    description: 'Order picked up from vendor',
  },
  in_transit: {
    icon: Navigation,
    label: 'In Transit',
    color: 'bg-purple-500',
    textColor: 'text-purple-500',
    description: 'On the way to customer',
  },
  delivered: {
    icon: CheckCircle2,
    label: 'Delivered',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    description: 'Order delivered successfully',
  },
  cancelled: {
    icon: Clock,
    label: 'Cancelled',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    description: 'Order was cancelled',
  },
}

const statusOrder: OrderStatus[] = ['assigned', 'picked_up', 'in_transit', 'delivered']

export function OrderTimeline({ status, timestamps, className }: OrderTimelineProps) {
  // Find the index of the current status
  const currentStatusIndex = statusOrder.indexOf(status)

  // Format timestamp to display time only
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return ''
    
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch (error) {
      return ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="font-semibold text-sm">Order Timeline</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3.5 top-0 h-full w-0.5 bg-gray-200" />
        
        {/* Timeline steps */}
        <div className="space-y-6 relative">
          {statusOrder.map((step, index) => {
            const config = statusConfig[step]
            const Icon = config.icon
            const timestamp = timestamps[step]
            
            // Determine step status
            const isCompleted = index < currentStatusIndex
            const isCurrent = index === currentStatusIndex
            const isPending = index > currentStatusIndex
            
            return (
              <div key={step} className="flex items-start gap-3">
                {/* Icon */}
                <div 
                  className={cn(
                    'relative z-10 flex items-center justify-center w-7 h-7 rounded-full',
                    isCompleted ? config.color : isCurrent ? 'bg-white border-2 border-current ' + config.textColor : 'bg-gray-200'
                  )}
                >
                  <Icon 
                    className={cn(
                      'w-3.5 h-3.5',
                      isCompleted || isPending ? 'text-white' : config.textColor
                    )} 
                  />
                  
                  {/* Pulsing effect for current status */}
                  {isCurrent && (
                    <span className="absolute w-full h-full rounded-full animate-ping opacity-75 border border-current"></span>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-0.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 
                        className={cn(
                          'font-medium',
                          isCompleted ? 'text-gray-700' : isCurrent ? config.textColor : 'text-gray-400'
                        )}
                      >
                        {config.label}
                      </h4>
                      <p 
                        className={cn(
                          'text-xs',
                          isCompleted || isCurrent ? 'text-gray-500' : 'text-gray-400'
                        )}
                      >
                        {config.description}
                      </p>
                    </div>
                    
                    {timestamp && (
                      <span 
                        className={cn(
                          'text-xs font-medium',
                          isCompleted ? 'text-gray-500' : isCurrent ? config.textColor : 'text-gray-400'
                        )}
                      >
                        {formatTime(timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 