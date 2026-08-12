class SmoothScroll {
  constructor(sectionSelector, options = {}) {
    this.sectionSelector = sectionSelector;

    this.sections = [];
    this.isAnimating = false;

    this.duration = options.duration ?? 1200;
    this.edgeOffset = options.edgeOffset ?? 2;
    this.wheelCooldown = options.wheelCooldown ?? 250;
    this.touchThreshold = options.touchThreshold ?? 50;

    this._wheelLocked = false;
    this._wheelUnlockTimer = 0;
    this._animationFrame = 0;
    this._touchStart = null;

    this._onWheel = this.onWheel.bind(this);
    this._onKeyDown = this.onKeyDown.bind(this);
    this._onResize = this.onResize.bind(this);
    this._onTouchStart = this.onTouchStart.bind(this);
    this._onTouchMove = this.onTouchMove.bind(this);
    this._onTouchEnd = this.onTouchEnd.bind(this);
    this._onTouchCancel = this.onTouchCancel.bind(this);
  }

  init() {
    this.sections = [...document.querySelectorAll(this.sectionSelector)];
    if (!this.sections.length) return;

    window.addEventListener("wheel", this._onWheel, { passive: false });
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("resize", this._onResize);
    window.addEventListener("touchstart", this._onTouchStart, {
      passive: true,
    });
    window.addEventListener("touchmove", this._onTouchMove, { passive: false });
    window.addEventListener("touchend", this._onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", this._onTouchCancel, {
      passive: true,
    });
  }

  destroy() {
    window.removeEventListener("wheel", this._onWheel);
    window.removeEventListener("keydown", this._onKeyDown);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("touchstart", this._onTouchStart);
    window.removeEventListener("touchmove", this._onTouchMove);
    window.removeEventListener("touchend", this._onTouchEnd);
    window.removeEventListener("touchcancel", this._onTouchCancel);
    clearTimeout(this._wheelUnlockTimer);
    this.cancelAnimation();
  }

  onResize() {
    this.sections = [...document.querySelectorAll(this.sectionSelector)];
  }

  onWheel(e) {
    if (this.isAnimating) {
      e.preventDefault();
      return;
    }

    const dir = Math.sign(e.deltaY);
    if (!dir) return;

    const idx = this.getActiveIndex();
    if (idx === -1) return;

    const { top, bottom } = this.getSectionBounds(idx);
    const y = window.scrollY;
    const vh = window.innerHeight;

    const canScrollDownInside = y + vh < bottom - this.edgeOffset;
    const canScrollUpInside = y > top + this.edgeOffset;

    if (dir > 0 && canScrollDownInside) return;
    if (dir < 0 && canScrollUpInside) return;

    if (this._wheelLocked) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    this.lockWheel();

    if (dir > 0) this.snapToIndex(idx + 1);
    else this.snapToIndex(idx - 1);
  }

  onTouchStart(e) {
    if (e.touches.length !== 1) {
      this._touchStart = null;
      return;
    }

    this.cancelAnimation();
    const touch = e.touches[0];
    this._touchStart = {
      x: touch.clientX,
      y: touch.clientY,
      index: this.getActiveIndex(),
    };
  }

  onTouchMove(e) {
    if (!this._touchStart || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - this._touchStart.x;
    const deltaY = touch.clientY - this._touchStart.y;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) >= 8) {
      e.preventDefault();
    }
  }

  onTouchEnd(e) {
    if (!this._touchStart || e.changedTouches.length !== 1) return;

    const touchStart = this._touchStart;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    this._touchStart = null;

    if (
      Math.abs(deltaY) < this.touchThreshold ||
      Math.abs(deltaY) <= Math.abs(deltaX)
    ) {
      return;
    }

    const idx = touchStart.index;
    if (idx === -1) return;

    this.snapToIndex(deltaY < 0 ? idx + 1 : idx - 1);
  }

  onTouchCancel() {
    this._touchStart = null;
  }

  onKeyDown(e) {
    if (this.isAnimating) return;

    const idx = this.getActiveIndex();
    if (idx === -1) return;

    if (e.key === "ArrowDown" || e.key === "PageDown") {
      e.preventDefault();
      this.snapToIndex(idx + 1);
    }

    if (e.key === "ArrowUp" || e.key === "PageUp") {
      e.preventDefault();
      this.snapToIndex(idx - 1);
    }

    if (e.key === "Home") {
      e.preventDefault();
      this.snapToIndex(0);
    }

    if (e.key === "End") {
      e.preventDefault();
      this.snapToIndex(this.sections.length - 1);
    }
  }

  lockWheel() {
    this._wheelLocked = true;
    clearTimeout(this._wheelUnlockTimer);
    this._wheelUnlockTimer = setTimeout(() => {
      this._wheelLocked = false;
    }, this.wheelCooldown);
  }

  snapToIndex(index) {
    const idx = Math.max(0, Math.min(this.sections.length - 1, index));
    const { top } = this.getSectionBounds(idx);
    this.scrollToY(top);
  }

  getSectionBounds(index) {
    const el = this.sections[index];
    const top = el.getBoundingClientRect().top + window.scrollY;
    const bottom = top + el.offsetHeight;
    return { top, bottom };
  }

  getActiveIndex() {
    const yMid = window.scrollY + window.innerHeight / 2;
    for (let i = 0; i < this.sections.length; i++) {
      const { top, bottom } = this.getSectionBounds(i);
      if (yMid >= top && yMid < bottom) return i;
    }
    return this.getClosestIndex();
  }

  getClosestIndex() {
    const y = window.scrollY;
    let best = 0;
    let bestDist = Infinity;

    for (let i = 0; i < this.sections.length; i++) {
      const { top } = this.getSectionBounds(i);
      const d = Math.abs(top - y);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  }

  scrollToY(targetY) {
    this.cancelAnimation();

    this.isAnimating = true;

    const startY = window.scrollY;
    const diff = targetY - startY;
    if (Math.abs(diff) <= this.edgeOffset) {
      this.isAnimating = false;
      return;
    }

    const startTime = performance.now();
    const duration = this.duration;

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      window.scrollTo(0, startY + diff * easeInOutCubic(t));
      if (t < 1) this._animationFrame = requestAnimationFrame(step);
      else {
        this._animationFrame = 0;
        this.isAnimating = false;
      }
    };

    this._animationFrame = requestAnimationFrame(step);
  }

  cancelAnimation() {
    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = 0;
    }
    this.isAnimating = false;
  }
}

export const smoothScroll = new SmoothScroll(".full-screen-section", {
  duration: 1400,
  wheelCooldown: 250,
  edgeOffset: 4,
  touchThreshold: 50,
});
