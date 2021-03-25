import React from 'react'
// Import styles
import './style.scss'

const BaseIconButton = ({ className = '', onClick = null, icon = null, ...rest }) => {
  return (
    <button className={`base-icon-button ${className}`} onClick={onClick} {...rest}>
      <img src={icon} />
    </button>
  )
}

export default BaseIconButton
