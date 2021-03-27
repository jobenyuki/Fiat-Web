import React, { useEffect, useRef, useState } from 'react'
import { FullScreen, useFullScreenHandle } from 'react-full-screen'
// Import custom components
import { BaseButton, BaseIconButton, WebGLRenderer } from 'Components/Common'
// Import utils
import { mobileCheck } from 'Utils'
// Import configs
import { AR_URL, LOGO_URL } from 'Configs'
// Import styles
import './style.scss'
// Import images
import LOADING_GIF from 'Assets/images/loading.gif'
import EIGHT_QR from 'Assets/images/8code.svg'
import CAR_LOGO_ICON from 'Assets/images/cars_com_logo 1.png'
import AR_ICON from 'Assets/images/AR_VIEW_Button.svg'
import FULL_SCREEN_ICON from 'Assets/images/Full_Screen_Button.svg'
import REFRESH_ICON from 'Assets/images/Refresh_Button.svg'

const isMobile = mobileCheck()

const Main = () => {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const fullScreenHandle = useFullScreenHandle()
  const rendererContainer = useRef()
  const renderer = useRef()

  // Create threejs renderer when component mounted
  useEffect(() => {
    renderer.current = new WebGLRenderer(
      rendererContainer.current,
      handleLoadingFinished,
      handleLoadingProgressChanged,
    )
    renderer.current.init()
    return () => {
      if (renderer.current) {
        renderer.current.dispose()
      }
    }
  }, [])

  // Listener for loading progress changed
  const handleLoadingProgressChanged = (progress) => {
    setLoadingProgress(progress)
  }

  // Listener for loading finished
  const handleLoadingFinished = () => {
    setLoading(false)
  }

  // Listener for AR button click
  const handleARClick = () => {
    if (isMobile) window.open(AR_URL, '_blank')
    else setShowQR(true)
  }

  // Listener for Fullscreen toogle button click
  const handleFullScreenToogleClick = () => {
    if (fullScreenHandle.active) fullScreenHandle.exit()
    else fullScreenHandle.enter()
  }

  // Listener for Refresh button click
  const handleRefreshClick = () => {
    if (renderer.current) {
      renderer.current.refresh()
    }
  }

  // Listener for Logo click
  const handleHomeNavigateClick = () => {
    window.open(LOGO_URL, '_blank')
  }

  // Listener for QR model close click
  const handleQRClose = () => {
    setShowQR(false)
  }

  return (
    <FullScreen handle={fullScreenHandle}>
      <div className="main">
        {loading && (
          <div className="main__loading-container">
            <p className="main__loading-label">{loadingProgress}%</p>
            <img className="main__loading-gif" src={LOADING_GIF} />
          </div>
        )}
        {showQR && (
          <div className="main__qr-code-modal">
            <div className="main__qr-code">
              <p>Scan QR code</p>
              <button onClick={handleQRClose} className="main__qr-code-close">
                X
              </button>
              <img src={EIGHT_QR} />
            </div>
          </div>
        )}
        <div className="main__logo">
          <img src={CAR_LOGO_ICON} onClick={handleHomeNavigateClick} />
        </div>
        <div className="main__controls-group">
          <BaseIconButton icon={AR_ICON} onClick={handleARClick} />
          {!isMobile && (
            <BaseIconButton icon={FULL_SCREEN_ICON} onClick={handleFullScreenToogleClick} />
          )}
          <BaseIconButton icon={REFRESH_ICON} onClick={handleRefreshClick} />
        </div>
        <BaseButton className="main__shop-button" onClick={handleHomeNavigateClick}>
          Shop Now
        </BaseButton>
        <p className="main__label">1972 Fiat 850 Spider</p>
        <div className="main__webgl-renderer" ref={rendererContainer} />
      </div>
    </FullScreen>
  )
}

export default Main
