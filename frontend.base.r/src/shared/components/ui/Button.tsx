import React from 'react'

type Size = 'sm' | 'md' | 'lg'
type Variant = 'primary' | 'outline' | 'ghost' | 'secondary'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
  variant?: Variant
}

const sizeClass: Record<Size, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const base =
  "inline-flex items-center justify-center text-sm font-medium rounded-[4px] focus:outline-none focus:ring-2";

const variantClass: Record<Variant, string> = {
  primary: `${base} text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500`,
  outline: `${base} border border-gray-300 text-gray-700 hover:bg-gray-100`,
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-50',
  secondary: `${base} text-gray-700 bg-gray-100 hover:bg-gray-200 focus:ring-gray-500`
}

export const Button: React.FC<Props> = ({ size = 'md', variant = 'primary', className = '', children, ...rest }) => {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-md ${sizeClass[size]} ${variantClass[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export default Button
