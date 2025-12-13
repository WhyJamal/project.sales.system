import React from 'react'

type Size = 'sm' | 'md' | 'lg'
type Variant = 'primary' | 'outline' | 'ghost'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
  variant?: Variant
}

const sizeClass: Record<Size, string> = {
  sm: 'px-2 py-1 text-sm',
  md: 'px-3 py-1 text-base',
  lg: 'px-6 py-3 text-lg',
}

const variantClass: Record<Variant, string> = {
  primary: 'bg-genblue text-white hover:bg-[#0957c6] shadow-lg',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-50'
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
