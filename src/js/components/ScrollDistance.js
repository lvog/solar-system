class ScrollDistance {
  constructor(selector, options = {}) {
    this.el = document.querySelector(selector);

    this.options = {
      maxDistance: 4500,
      unit: "AU",
      decimals: 1,
      padLength: 5,
      sectionSelector: ".full-screen-section",
      resizeDebounce: 150,
      ...options,
    };

    this.sections = [];
    this.sectionTops = [];

    this.ticking = false;
    this._animationFrame = 0;
    this._resizeTimeout = 0;

    this._resizeObserver = null;

    this._onScroll = this.requestUpdate.bind(this);
    this._onResize = this.debounce(
      this.recalculate.bind(this),
      this.options.resizeDebounce,
    );
    this._onLoad = this.recalculate.bind(this);
  }

  init() {
    if (!this.el) return;

    this.recalculate();

    window.addEventListener("scroll", this._onScroll, { passive: true });
    window.addEventListener("resize", this._onResize);

    // Ловимо стан "після повного довантаження" — картинки з loading="lazy"
    // та фонові зображення можуть змінити scrollHeight вже після DOMContentLoaded.
    if (document.readyState === "complete") {
      this.recalculate();
    } else {
      window.addEventListener("load", this._onLoad, { once: true });
    }

    // Ловимо будь-яку зміну висоти контенту (розкриття planet-card,
    // довантаження шрифтів, зміну макету) — не тільки resize вікна.
    if (typeof ResizeObserver !== "undefined") {
      this._resizeObserver = new ResizeObserver(this._onResize);
      this._resizeObserver.observe(document.body);
    }

    this.update();
  }

  destroy() {
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("resize", this._onResize);
    window.removeEventListener("load", this._onLoad);

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }

    if (this._animationFrame) {
      cancelAnimationFrame(this._animationFrame);
      this._animationFrame = 0;
    }

    clearTimeout(this._resizeTimeout);
    this.ticking = false;
  }

  debounce(fn, wait) {
    return (...args) => {
      clearTimeout(this._resizeTimeout);
      this._resizeTimeout = setTimeout(() => fn(...args), wait);
    };
  }

  recalculate() {
    this.sections = [
      ...document.querySelectorAll(this.options.sectionSelector),
    ];

    if (!this.sections.length) return;

    this.sectionTops = this.sections.map(
      (section) => section.getBoundingClientRect().top + window.scrollY,
    );

    this.requestUpdate();
  }

  requestUpdate() {
    if (this.ticking) return;

    this.ticking = true;

    this._animationFrame = requestAnimationFrame(() => {
      this.update();

      this.ticking = false;
      this._animationFrame = 0;
    });
  }

  update() {
    if (!this.sections.length) return;

    const scrollY = window.scrollY;
    const lastIndex = this.sections.length - 1;

    if (lastIndex === 0) {
      this.setValue(this.options.maxDistance);
      return;
    }

    if (scrollY <= this.sectionTops[0]) {
      this.setValue(0);
      return;
    }

    if (scrollY >= this.sectionTops[lastIndex]) {
      this.setValue(this.options.maxDistance);
      return;
    }

    let index = 0;

    for (let i = 0; i < lastIndex; i++) {
      if (scrollY >= this.sectionTops[i] && scrollY < this.sectionTops[i + 1]) {
        index = i;
        break;
      }
    }

    const start = this.sectionTops[index];
    const end = this.sectionTops[index + 1];

    const progress = end > start ? (scrollY - start) / (end - start) : 0;

    const sectionStep = Math.round(this.options.maxDistance / lastIndex);

    const startValue = index * sectionStep;

    const endValue =
      index + 1 === lastIndex
        ? this.options.maxDistance
        : (index + 1) * sectionStep;

    const value = startValue + (endValue - startValue) * progress;

    this.setValue(value);
  }

  setValue(value) {
    const formattedValue = value.toFixed(this.options.decimals);

    this.el.textContent = `${formattedValue.padStart(
      this.options.padLength,
      "0",
    )} ${this.options.unit}`;
  }
}

export const scrollDistance = new ScrollDistance(".distance");
