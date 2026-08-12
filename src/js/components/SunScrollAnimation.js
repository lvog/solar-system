export class SunScrollAnimation {
  constructor({
    sunSelector = ".sun",
    blockSelector = ".sun-info-block",
  } = {}) {
    this.sun = document.querySelector(sunSelector);
    this.blocks = [...document.querySelectorAll(blockSelector)];

    this.states = [
      { x: -50, s: 1.15 },
      { x: -70, s: 1 },
      { x: -115, s: 1.3 },
      { x: -50, s: 1.5 },
    ];

    this._raf = null;
    this._sunHeight = 0;
    this._startY = 0;

    this._onScroll = this._onScroll.bind(this);
    this._onResize = this._onResize.bind(this);

    this._activeSection = null;
  }

  init() {
    if (!this.sun || !this.blocks.length) return;

    this._recalc();

    window.addEventListener("scroll", this._onScroll, { passive: true });
    window.addEventListener("resize", this._onResize, { passive: true });

    this._onScroll();
  }

  _onResize() {
    this._recalc();
    this._onScroll();
  }

  _recalc() {
    this._sunHeight = this.sun.getBoundingClientRect().height || 0;
    this._startY = this.blocks[0].getBoundingClientRect().top + window.scrollY;
  }

  _onScroll() {
    if (this._raf) return;

    this._raf = requestAnimationFrame(() => {
      this._raf = null;
      this._update();
    });
  }

  _update() {
    const sunSection = this.sun.closest(".sun-section");
    if (!sunSection) return;

    const rect = sunSection.getBoundingClientRect();
    const vh = window.innerHeight;

    if (rect.bottom < 0 || rect.top > vh) return;

    const n = Math.min(this.blocks.length, this.states.length);
    if (n === 0) return;

    const vhPx = window.innerHeight || 1;

    const rawStage = (window.scrollY - this._startY) / vhPx;
    const stage = Math.max(0, Math.min(n - 1, rawStage));

    const index = Math.min(n - 1, Math.floor(stage));
    const nextIndex = Math.min(n - 1, index + 1);
    const t = stage - index;

    this._updateSectionClass({ index, t, n });

    const offsetPx = (vhPx - this._sunHeight) / 2;
    const yPx = stage * vhPx + offsetPx;

    const state =
      nextIndex === index
        ? { ...this.states[index] }
        : this._lerp(this.states[index], this.states[nextIndex], t);

    this._apply(state, yPx);
  }

  _updateSectionClass({ index, t, n }) {
    if (!this.sun) return;

    const EPS = 0.03;

    let sectionNumber = null;

    if (t <= EPS) {
      sectionNumber = index + 1;
    } else if (t >= 1 - EPS && index + 1 < n) {
      sectionNumber = index + 2;
    } else {
      sectionNumber = null;
    }

    if (sectionNumber === this._activeSection) return;
    this._activeSection = sectionNumber;

    [...this.sun.classList].forEach((cls) => {
      if (cls.startsWith("section-")) this.sun.classList.remove(cls);
    });

    if (sectionNumber) {
      this.sun.classList.add(`section-${sectionNumber}`);
    }
  }

  _lerp(a, b, t) {
    const s = t * t * (3 - 2 * t);
    const L = (x, y) => x + (y - x) * s;

    return {
      x: L(a.x, b.x),
      s: L(a.s, b.s),
    };
  }

  _apply(state, yPx) {
    this.sun.style.transform = `translate(${state.x}%, ${yPx}px) scale(${state.s})`;
  }
}

export const sunScroll = new SunScrollAnimation();
