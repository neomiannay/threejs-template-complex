import * as THREE from 'three'
import Experience from '../Experience.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {MeshBasicMaterial} from "three";
import ThirdPersonCamera from "./ThirdPersonCamera";

import vertex from '../Shaders/godray/vertex.glsl'
import fragment from '../Shaders/godray/fragment.glsl'

export default class Camera
{
    constructor(_options)
    {
        // Options
        this.experience = new Experience()
        this.config = this.experience.config
        this.debug = this.experience.debug
        this.time = this.experience.time
        this.sizes = this.experience.sizes
        this.targetElement = this.experience.targetElement
        this.scene = this.experience.scene

        // Set up
        this.mode = 'debug' // defaultCamera \ debugCamera

        this.group = new THREE.Group()

        this.setInstance()
        this.setGodRay()
        this.setModes()

        if (this.debug) {
            this.setDebug()
        }

        this.scene.add(this.group)
    }

    setInstance()
    {
        // Set up
        this.instance = new THREE.PerspectiveCamera(25, this.config.width / this.config.height, 0.1, 150)
        this.instance.position.set(0, 1.2, 0)
        this.group.add(this.instance)
    }

    setGodRay()
    {
        this.plane = new THREE.PlaneGeometry(4, 2)
        this.planeMaterial = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: {
                uResolution: { value: new THREE.Vector2() },
                uTime: { value: 0 },
                uCameraRotation: { value: new THREE.Vector3() },
            },
            vertexShader: vertex,
            fragmentShader: fragment,
        })
        this.instance = new THREE.PerspectiveCamera(25, this.config.width / this.config.height, 0.1, 10)
        this.instance.position.set(5, 2, 5)
        this.instance.rotation.reorder('YXZ')

        this.godRay = new THREE.Mesh(this.plane, this.planeMaterial)

        this.group.add(this.godRay)
        // Add to group
        this.group.add(this.instance)
    }

    setGodRay()
    {
        this.plane = new THREE.PlaneGeometry(4, 2)
        this.planeMaterial = new THREE.ShaderMaterial({
            transparent: true,
            side: THREE.DoubleSide,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2() },
                uCameraRotation: { value: new THREE.Vector3() },
            },
            vertexShader: vertex,
            fragmentShader: fragment,
        })

        this.godRay = new THREE.Mesh(this.plane, this.planeMaterial)

        this.group.add(this.godRay)
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
        this.modes.debug.instance.position.set(0, .7, 5)
        this.modes.debug.instance.rotation.set(-Math.PI * .04, 0, 0);

        this.modes.debug.instance.lookAt(this.scene.position)
        this.modes.debug.orbitControls = new OrbitControls(this.modes.debug.instance, this.targetElement)
        this.modes.debug.instance.position.set(0, 10, -45)
        this.modes.debug.orbitControls.enabled = this.modes.debug.active
        this.modes.debug.orbitControls.screenSpacePanning = true
        this.modes.debug.orbitControls.enableKeys = false
        this.modes.debug.orbitControls.enableZoom = false
        // this.modes.debug.orbitControls.zoomSpeed = 0.25
        this.modes.debug.orbitControls.enableDamping = true
        this.modes.debug.orbitControls.update()

        this.modes.follow = {}
        this.modes.follow.instance = this.instance.clone()
        this.modes.follow.instance.position.set(0, 0, 0)
        this.modes.follow.instance.rotation.reorder('YXZ')

        this.thirdPersonCamera = new ThirdPersonCamera();
    }

    setDebug() {

        this.PARAMS = {
            mode: this.mode,
        }

        this.debugFolder = this.debug.addFolder({
            title: 'Camera',
            expanded: true,
        })

        this.debugFolder
            .addBinding(this.PARAMS, 'mode', {
                options: {
                    default: 'default',
                    debug: 'debug',
                    follow: 'follow',
                }
            })
            .on('change', () => {
                this.mode = this.PARAMS.mode
            })

    }


    resize()
    {
        this.instance.aspect = this.config.width / this.config.height
        this.instance.updateProjectionMatrix()

        this.modes.default.instance.aspect = this.config.width / this.config.height
        this.modes.default.instance.updateProjectionMatrix()

        this.modes.debug.instance.aspect = this.config.width / this.config.height
        this.modes.debug.instance.updateProjectionMatrix()

        this.modes.follow.instance.aspect = this.config.width / this.config.height
        this.modes.follow.instance.updateProjectionMatrix()
    }

    update()
    {
        // Update debug orbit controls
        this.modes.debug.orbitControls.update()

        // Apply coordinates
        this.instance.position.copy(this.modes[this.mode].instance.position)
        this.instance.quaternion.copy(this.modes[this.mode].instance.quaternion)
        this.instance.updateMatrixWorld() // To be used in projection

        // Update godray
        if(this.godRay)
        {
            this.planeMaterial.uniforms.uTime.value = this.time.delta * 0.001
            this.planeMaterial.uniforms.uResolution.value.set(this.config.width, this.config.height)
            this.planeMaterial.uniforms.uCameraRotation.value.copy(this.instance.rotation)
        }

        // Update the followerCamera position
        if (this.experience.character && this.mode === 'follow') {
            this.thirdPersonCamera.update()
        }

        // Apply uniforms
        this.planeMaterial.uniforms.uTime.value = performance.now() / 1000;
        this.planeMaterial.uniforms.uResolution.value.copy(
            new THREE.Vector2(window.innerWidth, window.innerHeight)
        );
        this.planeMaterial.uniforms.uCameraRotation.value.copy(this.instance.rotation)
        this.godRay.rotation.copy(this.instance.rotation)
    }

    destroy()
    {
        this.modes.debug.orbitControls.destroy()
    }
}
