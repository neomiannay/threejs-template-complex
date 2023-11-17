import * as THREE from 'three'
import Experience from '../Experience.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera {
    constructor(_options) {
        // Options
        this.experience = new Experience()
        this.config = this.experience.config
        this.time = this.experience.time
        this.sizes = this.experience.sizes
        this.targetElement = this.experience.targetElement
        this.scene = this.experience.scene
        this.debug = this.experience.debug;

        // Set up
        this.mode = 'follow' // defaultCamera \ debugCamera \ followCharacter

        this.setInstance()
        this.setModes()
    }

    setInstance() {
        // Set up
        this.instance = new THREE.PerspectiveCamera(25, this.config.width / this.config.height, 0.1, 150)
        // this.modes.debug.instance.position.set(0, .7, 5)
        // this.modes.debug.instance.rotation.set(-Math.PI * .04, 0, 0);
        this.instance.position.set(0, 1.2, 5)
        this.instance.rotation.set(-Math.PI * .06, 0, 0);
        this.instance.rotation.reorder('YXZ')

        if (this.debug) {
            this.debugCameraFolder = this.debug.addFolder({
                title: 'camera',
                target: this.instance,
                closed: false,
                open: true
            })

            this.debugCameraFolder.addBinding(this.instance.position, 'x', {
                x: {min: -10, max: 10},
                y: {step: 10},
                z: {max: 0},
            })

            this.scene.add(this.instance)
        }
    }

    setModes()
    {
        this.modes = {}

        // Default
        this.modes.default = {}
        this.modes.default.instance = this.instance.clone()
        this.modes.default.instance.rotation.reorder('YXZ')

        // Debug
        this.modes.debug = {}
        this.modes.debug.instance = this.instance.clone()
        this.modes.debug.instance.rotation.reorder('YXZ')

        // this.modes.debug.instance.lookAt(this.scene.position)

        this.modes.debug.orbitControls = new OrbitControls(this.modes.debug.instance, this.targetElement)
        this.modes.debug.orbitControls.enabled = this.modes.debug.active
        this.modes.debug.orbitControls.screenSpacePanning = true
        this.modes.debug.orbitControls.enableKeys = false
        this.modes.debug.orbitControls.enableZoom = false
        // this.modes.debug.orbitControls.zoomSpeed = 0.25
        this.modes.debug.orbitControls.enableDamping = true
        this.modes.debug.orbitControls.update()

        this.modes.follow = {}
        this.modes.follow.instance = this.instance.clone()
        this.modes.follow.instance.rotation.reorder('YXZ')
    }


    resize()
    {
        this.instance.aspect = this.config.width / this.config.height
        this.instance.updateProjectionMatrix()

        this.modes.default.instance.aspect = this.config.width / this.config.height
        this.modes.default.instance.updateProjectionMatrix()

        this.modes.debug.instance.aspect = this.config.width / this.config.height
        this.modes.debug.instance.updateProjectionMatrix()
    }

    update()
    {
        // Update debug orbit controls
        this.modes.debug.orbitControls.update()

        // Apply coordinates
        this.instance.position.copy(this.modes[this.mode].instance.position)
        this.instance.quaternion.copy(this.modes[this.mode].instance.quaternion)
        this.instance.updateMatrixWorld() // To be used in projection

        // Update the followerCamera position
        if (this.experience.scene.getObjectByName('character')) {
            this.modes.follow.instance.position.copy(
                // Make the camera follow the character, behind it
                this.experience.scene.getObjectByName('character').position.clone().add(
                    new THREE.Vector3(0, 1, 4)
                )
            )
        }
    }

    destroy()
    {
        this.modes.debug.orbitControls.destroy()
    }
}
