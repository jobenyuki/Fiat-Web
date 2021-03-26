import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// TODO remove
import Stats from 'three/examples/jsm/libs/stats.module'
// Import utils
import {
  getCubeMapTexture,
  getCanvasRelativePosition,
  getGLTF,
  getTexture,
  rotateGsapTo,
  mobileCheck,
} from 'Utils'
// Import configs
import { ASSET_PATH } from 'Configs'

const isMobile = mobileCheck()

class WebGLRenderer {
  constructor(container, loadingFinishedCB, loadingProgressChangedCB) {
    this.container = container // Parent node of canvas
    this.loadingFinishedCB = loadingFinishedCB // Callback for loading finished
    this.loadingProgressChangedCB = loadingProgressChangedCB // Callback for loading progress changed
    this.width = container.offsetWidth // Container width
    this.height = container.offsetHeight // Container height
    this.aspect = this.width / this.height // Camera aspect
    this.ratio = window.devicePixelRatio // Display ratio
    this.raycaster = new THREE.Raycaster() // Raycaster obj
    this.mouse = new THREE.Vector2() // Vector2 for mouse
    this.disposed = false // Flag for disposal. If true stop rendering and remove all scene element
    this.modelPath = `${ASSET_PATH}/models/fiat.glb` // Path of glb
    this.envMapPath = `${ASSET_PATH}/environments/env2.hdr` // Path of environment map
    this.shadowPath = `${ASSET_PATH}/images/shadow.png` // Path of environment map
    this.doorLockIconPath = `${ASSET_PATH}/images/door_lock.png` // Path of door lock
    this.doorUnlockIconPath = `${ASSET_PATH}/images/door_unlock.png` // Path of door unlock
    this.headlightNormalPath = `${ASSET_PATH}/images/Headlight_Normal_0.png` // Path of door unlock
    this.progressableAssetPathArr = [this.modelPath, this.envMapPath] // Path array of assets
    this.leftDoorPivot = new THREE.Vector3(-65, 0, -57) // Left door pivot
    this.rightDoorPivot = new THREE.Vector3(65, 0, -57) // Right door pivot
    this.yAxis = new THREE.Vector3(0, 1, 0) // Normalized vector3 for y axis
    this.doorAnimation = [] // Door GSAP animation array
    this.loadedAssets = false // Flag for checking if assets were loaded or not
    this.loadingProgress = new Array(this.progressableAssetPathArr.length) // Progress of loading status
  }

  /**
   * Initialize all setups
   */
  init = () => {
    this.rendererSetup()
    this.sceneSetup()
    this.cameraSetup()
    this.lightSetup()
    this.loadAssets()
    this.eventSetup()
    this.tick()
  }

  /**
   * Setup renderer and append to dom
   */
  rendererSetup = () => {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(this.ratio)
    this.renderer.setSize(this.width, this.height)
    this.renderer.physicallyCorrectLights = true
    this.renderer.outputEncoding = THREE.sRGBEncoding
    this.container.appendChild(this.renderer.domElement)

    // TODO remove
    this.stats = new Stats()
    this.container.appendChild(this.stats.dom)

    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer)
    this.pmremGenerator.compileEquirectangularShader()
  }

  /**
   * Setup scene
   */
  sceneSetup = () => {
    this.scene = new THREE.Scene()
  }

  /**
   * Setup camera, add controls
   */
  cameraSetup = () => {
    this.camera = new THREE.PerspectiveCamera(40, this.aspect, 0.01, 1000)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.maxPolarAngle = Math.PI * 0.5
    this.controls.enableDamping = false
    this.controls.autoRotate = true
    this.controls.autoRotateSpeed = 0.3

    this.scene.add(this.camera)
  }

  /**
   * Setup all lights
   */
  lightSetup = () => {
    const hemiLight = new THREE.HemisphereLight()
    this.scene.add(hemiLight)

    const ambLight = new THREE.AmbientLight(0x808080, 0.3)
    this.camera.add(ambLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 5)
    dirLight.position.set(0.5, 0, 0.866)
    this.camera.add(dirLight)
  }

  /**
   * Load all needed assets
   */
  loadAssets = () => {
    Promise.all([
      getGLTF(this.progressableAssetPathArr[0], this.loadingProgressListener, 0),
      getCubeMapTexture(
        this.progressableAssetPathArr[1],
        this.pmremGenerator,
        this.loadingProgressListener,
        1,
      ),
      getTexture(this.shadowPath, this.renderer),
      getTexture(this.doorLockIconPath, this.renderer),
      getTexture(this.doorUnlockIconPath, this.renderer),
      getTexture(this.headlightNormalPath, this.renderer),
    ]).then((values) => {
      this.model = values[0]
      this.envMap = values[1]
      this.shadow = values[2]
      this.doorLockIcon = values[3]
      this.doorUnlockIcon = values[4]
      this.headlightNormal = values[5]

      this.loadingFinishedCB()
      this.meshSetup()
      this.cameraReset()
      this.environmentSetup()
      this.animationSetup()
      this.loadedAssets = true
    })
  }

  /**
   * Loading progress callback
   */
  loadingProgressListener = (progress, pathIndex) => {
    this.loadingProgress[pathIndex] = progress
    const totalProgress = (
      this.loadingProgress.reduce((a, b) => a + b, 0) / this.progressableAssetPathArr.length
    ).toFixed(0)
    this.loadingProgressChangedCB(totalProgress)
  }

  /**
   * Setup all meshes, models
   */
  meshSetup = () => {
    // Material redefine
    const bodyMat = new THREE.MeshPhysicalMaterial({
      clearcoat: 1,
      color: new THREE.Color(0.269614577293396, 0.005956323351711035, 0.0055613950826227665),
      metalness: 1,
      roughness: 0.5307692289352417,
      side: THREE.DoubleSide,
    })
    const crystalMat = new THREE.MeshPhysicalMaterial({
      clearcoat: 1,
      color: new THREE.Color(0, 0, 0),
      opacity: 0.1,
      transparent: true,
      depthWrite: false,
    })
    const headlightMat = new THREE.MeshPhysicalMaterial({
      normalMap: this.headlightNormal,
      color: new THREE.Color(1, 1, 1),
      emissive: new THREE.Color(1, 1, 1),
      depthWrite: false,
      normalScale: new THREE.Vector2(1, -1),
      clearcoat: 0.7,
      roughness: 0,
      side: THREE.DoubleSide,
      transmission: 0.8,
      transparent: true,
      reflectivity: 1,
      refractionRatio: 0.75,
    })

    // GLTF model
    const box = new THREE.Box3().setFromObject(this.model)
    this.modelSize = box.getSize(new THREE.Vector3()).length()
    this.modelCenter = box.getCenter(new THREE.Vector3())
    const height = box.getSize().y
    this.model.traverse((child) => {
      if (child.isMesh && child?.material.name === 'paint') {
        child.material = bodyMat
      }
      if (child.isMesh && child?.material.name === 'Cristal') {
        child.material = headlightMat
      }
      if (
        child.isMesh &&
        (child?.material.name === 'Cristal.001' || child?.material.name === 'Cristal.002')
      ) {
        child.material = crystalMat
      }
      if (
        child.isMesh &&
        (child?.material.name === 'tire_tread' || child?.material.name === 'tire_side')
      ) {
        const tireMat = child.material
        tireMat.color = new THREE.Color('#000000')
        tireMat.metalness = 0.5
      }
    })
    this.model.position.x += this.model.position.x - this.modelCenter.x
    this.model.position.y += this.model.position.y - this.modelCenter.y
    this.model.position.z += this.model.position.z - this.modelCenter.z

    // Shadow
    const shadowMat = new THREE.MeshBasicMaterial({
      map: this.shadow,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    })
    const shadowGeo = new THREE.PlaneBufferGeometry(540, 540)
    this.shadow = new THREE.Mesh(shadowGeo, shadowMat)
    this.shadow.rotateX(Math.PI * 0.5)
    this.shadow.rotateZ(Math.PI)
    this.shadow.position.z += 9
    this.shadow.position.y -= height * 0.5

    // Doors
    this.leftDoor = this.model.getObjectByName('Plane006')
    this.rightDoor = this.model.getObjectByName('Plane050')

    // Door lock/unlock hotspots
    const doorLockMat = new THREE.MeshBasicMaterial({
      map: this.doorUnlockIcon,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    })
    const doorLockGeo = new THREE.CircleBufferGeometry(10)
    this.doorLockHotspot = new THREE.Mesh(doorLockGeo, doorLockMat)
    this.doorLockHotspot.position.set(0, 80, 0)
    this.doorLockHotspot.interactable = true
    this.doorLockHotspot.picked = false
    this.doorLockHotspot.rotateX(Math.PI / 2)

    // Add objects to scene
    this.scene.add(this.model)
    this.scene.add(this.shadow)
    this.scene.add(this.doorLockHotspot)
    // TODO remove
    console.log(this.renderer.info)
  }

  /**
   * Resetup camera
   */
  cameraReset = () => {
    this.controls.reset()
    this.controls.maxDistance = this.modelSize * 10
    this.camera.near = this.modelSize / 100
    this.camera.far = this.modelSize * 100
    this.camera.updateProjectionMatrix()
    this.camera.position.copy(this.modelCenter)
    this.camera.position.x -= this.modelSize * (isMobile ? 1.6 : 0.8)
    this.camera.position.y += this.modelSize * (isMobile ? 0.8 : 0.4)
    this.camera.position.z -= this.modelSize * (isMobile ? 1.6 : 0.8)
    this.camera.lookAt(this.modelCenter)
  }

  /**
   * Setup environment
   */
  environmentSetup = () => {
    this.scene.environment = this.envMap
  }

  /**
   * Setup animation
   */
  animationSetup = () => {
    this.doorAnimation = [
      rotateGsapTo({
        yRad2: -Math.PI / 4,
        object: this.leftDoor,
        pivot: this.leftDoorPivot,
        axis: this.yAxis,
      }),
      rotateGsapTo({
        yRad2: Math.PI / 4,
        object: this.rightDoor,
        pivot: this.rightDoorPivot,
        axis: this.yAxis,
      }),
      ...this.doorAnimation,
    ]
  }

  /**
   * Setup event listener
   */
  eventSetup = () => {
    window.addEventListener('resize', this.onWindowResize, false)
    window.addEventListener('mousemove', this.onMouseMove, false)
    window.addEventListener('click', this.onMouseClick, false)
    window.addEventListener('touchend', this.onTouchEnd, false)
  }

  /**
   * Resize event listener
   */
  onWindowResize = () => {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.aspect = this.width / this.height

    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.aspect

    this.camera.updateProjectionMatrix()
  }

  /**
   * Mousemove event listener
   */
  onMouseMove = (e) => {
    const pos = getCanvasRelativePosition(e, this.renderer.domElement, this.width, this.height) // Adjusted mouse position related to canvas view size

    this.raycasterUpdate(pos)
  }

  /**
   * Mouse click event listener
   */
  onMouseClick = () => {
    if (!this.curHoveredInteractableObj) return

    const { picked } = this.curHoveredInteractableObj

    if (picked) {
      this.doorAnimation[0].reverse()
      this.doorAnimation[1].reverse()
      this.curHoveredInteractableObj.material.map = this.doorUnlockIcon
    } else {
      this.doorAnimation[0].play()
      this.doorAnimation[1].play()
      this.curHoveredInteractableObj.material.map = this.doorLockIcon
    }

    this.curHoveredInteractableObj.picked = !picked
  }

  /**
   * Touch end event listener
   */
  onTouchEnd = (e) => {
    // If more than 1 touch detected then ignore.
    if (e.type == 'touchend' && e.touches.length > 0) return

    this.raycasterUpdate({ x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY })
    this.onMouseClick()
  }

  /**
   * Raycaster update
   */
  raycasterUpdate = ({ x, y }) => {
    if (!this.loadedAssets) return

    // Mouse update
    this.mouse.x = (x / this.width) * 2 - 1
    this.mouse.y = -(y / this.height) * 2 + 1

    // Interseted objects by updated raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)
    this.intersects = this.raycaster.intersectObjects([this.doorLockHotspot], true)

    // If no intersected object, return
    if (this.intersects.length === 0) {
      this.recoverStatus()
      return
    }

    this.curHoveredObj = this.intersects[0].object
    const { material, interactable } = this.curHoveredObj

    // If hovered object is interacterble, add hover effects
    if (interactable) {
      this.setPointerCursor(true)
      material.opacity = 1
      this.curHoveredInteractableObj = this.curHoveredObj // Save current hovered interactable object
      this.prevHoveredObj = this.curHoveredObj // Save current hovered object as previous hovered one
    } else {
      this.recoverStatus()
    }
  }

  /**
   * Change pointer cursor
   */
  setPointerCursor = (show) => {
    if (show) this.container.classList.add('cursor-pointer')
    else this.container.classList.remove('cursor-pointer')
  }

  /**
   * Recover status
   */
  recoverStatus = () => {
    this.setPointerCursor(false)
    this.curHoveredInteractableObj = null
    if (this.prevHoveredObj) {
      this.prevHoveredObj.material.opacity = 0.5
      this.prevHoveredObj = null
    }
  }

  /**
   * Set dispose flat as true
   */
  dispose = () => {
    this.disposed = true
  }

  /**
   * Refresh
   */
  refresh = () => {
    this.cameraReset()

    this.doorAnimation.forEach((anim) => {
      anim.pause()
      anim.seek(0)
    })

    this.doorLockHotspot.picked = false
    this.doorLockHotspot.material.map = this.doorUnlockIcon
  }

  /**
   * Update per frame
   */
  update = () => {
    // Update controls
    this.controls.update()
    // Set hotspot to look at camera all the time
    this.doorLockHotspot.lookAt(this.camera.position)
    // TODO remove
    this.stats.update()
  }

  /**
   * Render per frame
   */
  render = () => {
    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Tick
   */
  tick = () => {
    this.requestID = window.requestAnimationFrame(this.tick)

    if (!this.loadedAssets) return

    // If disposed, remove all event listeners and frame update
    if (this.disposed) {
      window.cancelAnimationFrame(this.requestID)
      window.removeEventListener('resize', this.onWindowResize)
      document.removeEventListener('mousemove', this.onMouseMove)
      return
    }

    this.render()
    this.update()
  }
}

export default WebGLRenderer
