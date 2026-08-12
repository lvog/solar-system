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
      entries.forEach((entry) => {
        entry.target.classList.toggle(
          "in-viewport",
          entry.intersectionRatio >= this.options.threshold,
        );
      });
    }, this.options);

    this.elements.forEach((el) => this.observer.observe(el));
  }
}

export const viewportObserver = new InViewportObserver(".viewport");
