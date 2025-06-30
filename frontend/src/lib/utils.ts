import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat().format(num)
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(dateObj)
}

export function formatRelativeTime(date: Date | string) {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  } else {
    return formatDate(dateObj)
  }
}

export function truncateAddress(address: string, startLength = 6, endLength = 4) {
  if (address.length <= startLength + endLength) {
    return address
  }
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text
  }
  return text.slice(0, maxLength) + '...'
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  } else {
    // Fallback for older browsers
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    try {
      document.execCommand('copy')
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
    document.body.removeChild(textArea)
    return Promise.resolve()
  }
}

export function downloadFile(content: string, filename: string, contentType = 'text/plain') {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getRandomColor() {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function getSeverityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'text-nova-red-600 bg-nova-red-100 dark:text-nova-red-300 dark:bg-nova-red-900/20'
    case 'high':
      return 'text-nova-orange-600 bg-nova-orange-100 dark:text-nova-orange-300 dark:bg-nova-orange-900/20'
    case 'medium':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/20'
    case 'low':
      return 'text-nova-green-600 bg-nova-green-100 dark:text-nova-green-300 dark:bg-nova-green-900/20'
    case 'info':
      return 'text-nova-blue-600 bg-nova-blue-100 dark:text-nova-blue-300 dark:bg-nova-blue-900/20'
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20'
  }
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'success':
    case 'completed':
    case 'passed':
      return 'text-nova-green-600 bg-nova-green-100 dark:text-nova-green-300 dark:bg-nova-green-900/20'
    case 'warning':
    case 'pending':
      return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/20'
    case 'error':
    case 'failed':
      return 'text-nova-red-600 bg-nova-red-100 dark:text-nova-red-300 dark:bg-nova-red-900/20'
    case 'processing':
    case 'running':
      return 'text-nova-blue-600 bg-nova-blue-100 dark:text-nova-blue-300 dark:bg-nova-blue-900/20'
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-900/20'
  }
}
