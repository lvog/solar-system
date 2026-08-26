class InViewportObserver {
  constructor(selector, options = {}) {
    this.selector = selector;
    this.options = {
      threshold: 0.8,
      root: null,
      ...options,
    };

    this.elements = [];
    this.observer = null;
  }

  init() {
    this.elements = document.querySelectorAll(this.selector);
    if (!this.elements.length) return;

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => this.handleEntry(entry));
    }, this.options);

    this.elements.forEach((el) => this.observer.observe(el));
  }

  handleEntry(entry) {
    const el = entry.target;
    const isVisible = entry.intersectionRatio >= this.options.threshold;
    const isOnce = "viewportOnce" in el.dataset;

    if (isOnce) {
      if (isVisible) {
        el.classList.add("in-viewport");
        this.observer.unobserve(el);
      }
      return;
    }

    el.classList.toggle("in-viewport", isVisible);
  }
}

export const viewportObserver = new InViewportObserver(".viewport");
