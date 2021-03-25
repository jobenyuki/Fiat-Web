import React from 'react'
// Import styles
import './style.scss'

const BaseButton = ({ className = '', onClick = null, children = '', ...rest }) => {
  return (
    <button className={`base-button ${className}`} onClick={onClick} {...rest}>
      {children}
    </button>
  )
}

export default BaseButton
