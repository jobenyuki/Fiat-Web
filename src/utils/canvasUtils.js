import * as THREE from 'three'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Power1, gsap } from 'gsap/gsap-core'

/**
 * Get mouse position relative to canvas
 * @param e Event
 * @param canvas Canvas container
 * @param width Canvas width
 * @param height Canvas height
 * @returns mouse position relative to canvas
 */
const getCanvasRelativePosition = (e, canvas, width, height) => {
  const rect = canvas.getBoundingClientRect()
  return {
    x: ((e.clientX - rect.left) * width) / rect.width,
    y: ((e.clientY - rect.top) * height) / rect.height,
  }
}

/**
 * Get cube map texture from file system
 * @param path path of cube map
 * @param pmremGenerator pmremGenerator
 * @returns
 */
const getCubeMapTexture = (path, pmremGenerator, loadingProgressCB, pathIndex) => {
  return new Promise((resolve, reject) => {
    new RGBELoader().setDataType(THREE.UnsignedByteType).load(
      path,
      (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture
        pmremGenerator.dispose()

        resolve(envMap)
      },
      ({ loaded, total }) => {
        loadingProgressCB((loaded / total) * 100, pathIndex)
      },
      reject,
    )
  })
}

/**
 * Get gltf from file system
 * @param path path of gltf model
 * @returns
 */
const getGLTF = (path, loadingProgressCB, pathIndex) => {
  const gltfLoader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()

  dracoLoader.setDecoderPath('three/examples/js/libs/draco/')
  gltfLoader.setDRACOLoader(dracoLoader)

  return new Promise((resolve, reject) => {
    gltfLoader.load(
      path,
      (gltf) => {
        resolve(gltf.scene)
      },
      ({ loaded, total }) => {
        loadingProgressCB((loaded / total) * 100, pathIndex)
      },
      reject,
    )
  })
}

/**
 * Get texture from file system
 * @param path path of texture
 * @returns
 */
const getTexture = (path, renderer) => {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      path,
      (texture) => {
        texture.anisotropy = renderer.getMaxAnisotropy()
        resolve(texture)
      },
      undefined,
      reject,
    )
  })
}

/**
 * Rotate object arount specific position
 * @param obj
 * @param point
 * @param axis
 * @param theta
 * @param pointIsWorld
 */
const rotateAboutPoint = (obj, point, axis, theta, pointIsWorld) => {
  if (pointIsWorld) {
    obj.parent.localToWorld(obj.position) // compensate for world coordinate
  }

  obj.position.sub(point) // remove the offset
  obj.position.applyAxisAngle(axis, theta) // rotate the POSITION
  obj.position.add(point) // re-add the offset

  if (pointIsWorld) {
    obj.parent.worldToLocal(obj.position) // undo world coordinates compensation
  }

  obj.rotateOnAxis(axis, theta) // rotate the OBJECT
}

/**
 * GSAP rotate
 */
const rotateGsapTo = ({
  duration = 3,
  xRad1 = 0,
  xRad2 = 0,
  yRad1 = 0,
  yRad2 = 0,
  zRad1 = 0,
  zRad2 = 0,
  object,
  pivot,
  axis,
  isWorld = false,
}) => {
  const radianRot = { x: xRad1, y: yRad1, z: zRad1 }
  let prevRot = { x: 0, y: 0, z: 0 }

  return gsap
    .to(radianRot, {
      duration,
      x: xRad2,
      y: yRad2,
      z: zRad2,
      ease: Power1.easeOut,
      onUpdate: () => {
        rotateAboutPoint(object, pivot, axis, -prevRot.y, isWorld)
        rotateAboutPoint(object, pivot, axis, radianRot.y, isWorld)
        prevRot = { ...radianRot }
      },
    })
    .pause()
}

export {
  getCubeMapTexture,
  getCanvasRelativePosition,
  getGLTF,
  getTexture,
  rotateAboutPoint,
  rotateGsapTo,
}
