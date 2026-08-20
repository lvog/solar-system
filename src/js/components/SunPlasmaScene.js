import * as THREE from "three";

class SunPlasmaScene {
  constructor({ container = document.body, radius = 1.6 } = {}) {
    this.container = container;
    this.radius = radius;

    this.renderer = null;
    this.scene = null;
    this.camera = null;

    this.sun = null;
    this.uniforms = null;

    this.clock = new THREE.Clock();
    this._raf = 0;
    this._isVisible = true;
    this._visibilityObserver = null;

    this._onResize = this._onResize.bind(this);
    this._animate = this._animate.bind(this);
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(
      this.container.clientWidth || window.innerWidth,
      this.container.clientHeight || window.innerHeight,
    );
    this.container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = null;

    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    this.camera.position.set(0, 0, 6);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.15));

    this._createSun();

    this._fitCameraToSun();

    window.addEventListener("resize", this._onResize);
    this._visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        this._isVisible = entry.isIntersecting;
        if (this._isVisible && !this._raf) {
          this.clock.getDelta();
          this._animate();
        }
      },
      { rootMargin: "200px 0px" },
    );
    this._visibilityObserver.observe(this.container);

    this._animate();

    return this;
  }

  destroy() {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
    window.removeEventListener("resize", this._onResize);
    this._visibilityObserver?.disconnect();
    this._visibilityObserver = null;

    if (this.sun) {
      this.sun.geometry.dispose();
      this.sun.material.dispose();
      this.scene.remove(this.sun);
      this.sun = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement?.parentNode) {
        this.renderer.domElement.parentNode.removeChild(
          this.renderer.domElement,
        );
      }
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
  }

  setIntensity(intensity) {
    if (this.uniforms) this.uniforms.uIntensity.value = intensity;
  }

  _createSun() {
    this.uniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.25 },
    };

    const vertexShader = /* glsl */ `
      varying vec3 vNormalW;
      void main() {
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = /* glsl */ `
      precision highp float;
    
      varying vec3 vNormalW;
    
      uniform float uTime;
      uniform float uIntensity;
    
      float hash(vec3 p) {
        p = fract(p * 0.1031);
        p += dot(p, p.yzx + 33.33);
        return fract((p.x + p.y) * p.z);
      }
    
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
    
        float n000 = hash(i + vec3(0,0,0));
        float n100 = hash(i + vec3(1,0,0));
        float n010 = hash(i + vec3(0,1,0));
        float n110 = hash(i + vec3(1,1,0));
        float n001 = hash(i + vec3(0,0,1));
        float n101 = hash(i + vec3(1,0,1));
        float n011 = hash(i + vec3(0,1,1));
        float n111 = hash(i + vec3(1,1,1));
    
        vec3 u = f * f * (3.0 - 2.0 * f);
    
        float nx00 = mix(n000, n100, u.x);
        float nx10 = mix(n010, n110, u.x);
        float nx01 = mix(n001, n101, u.x);
        float nx11 = mix(n011, n111, u.x);
    
        float nxy0 = mix(nx00, nx10, u.y);
        float nxy1 = mix(nx01, nx11, u.y);
    
        return mix(nxy0, nxy1, u.z);
      }
    
      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }
    
      float bursts(vec3 p, float t) {
        float b = 0.0;
        for (int i = 0; i < 6; i++) {
          float fi = float(i);
          vec3 c = normalize(vec3(
            sin(fi * 2.1 + t * 0.7),
            cos(fi * 1.7 + t * 0.6),
            sin(fi * 1.3 - t * 0.5)
          ));
          float d = distance(p, c);
          float pulse = smoothstep(0.92, 1.0, sin(t * (2.2 + fi * 0.2) + fi));
          b += pulse * exp(-d * 10.0);
        }
        return b;
      }
    
      void main() {
        float t = uTime;
        vec3 p = normalize(vNormalW);
    
        float n1 = fbm(p * 4.0 + vec3(t * 0.35, -t * 0.22, t * 0.18));
        float n2 = fbm(p * 9.0 + vec3(-t * 0.55, t * 0.30, -t * 0.25));
        float plasma = n1 * 0.65 + n2 * 0.35;
        plasma += 0.20 * fbm(p * 18.0 + vec3(t * 0.9));
    
        float b = bursts(p, t);
        plasma += b * 1.1;
    
        float view = clamp(p.z * 0.5 + 0.5, 0.0, 1.0);
        float limb = smoothstep(0.0, 1.0, view);
        float glow = pow(1.0 - view, 2.0);
    
        vec3 cCore = vec3(1.0, 0.95, 0.75);
        vec3 cMid  = vec3(1.0, 0.55, 0.10);
        vec3 cEdge = vec3(0.65, 0.06, 0.02);
    
        float heat = clamp(plasma, 0.0, 1.0);
        vec3 col = mix(cEdge, cMid, heat);
        col = mix(col, cCore, smoothstep(0.55, 1.0, heat));
    
        col += vec3(1.0, 0.85, 0.4) * b * 0.9;
    
        float intensity = (0.7 + heat) * (0.35 + 0.65 * limb) * uIntensity + glow * 0.9;
        col *= intensity;
        col = clamp(col, 0.0, 3.0);
    
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const geom = new THREE.SphereGeometry(this.radius, 96, 96);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
    });

    this.sun = new THREE.Mesh(geom, mat);
    this.scene.add(this.sun);
  }

  _fitCameraToSun(padding = 1.09) {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const aspect = w / h;

    const r = this.radius * padding;

    const vFov = THREE.MathUtils.degToRad(this.camera.fov);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);

    const distV = r / Math.tan(vFov / 2);
    const distH = r / Math.tan(hFov / 2);

    this.camera.position.set(0, 0, Math.max(distV, distH));
    this.camera.updateProjectionMatrix();
  }

  _animate() {
    if (!this._isVisible) {
      this._raf = 0;
      return;
    }

    this._raf = requestAnimationFrame(this._animate);

    const dt = this.clock.getDelta();
    this.uniforms.uTime.value += dt;

    if (this.sun) this.sun.rotation.y += dt * 0.15;

    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._fitCameraToSun();
  }
}

export const sunPlasmaScene = new SunPlasmaScene({
  container: document.querySelector(".sun"),
  radius: 1.7,
});
