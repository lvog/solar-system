const PHASE_BEFORE = "before";
const PHASE_PINNED = "pinned";
const PHASE_AFTER = "after";

class MoonsScrollAnimation {
  constructor(holderSelector, options = {}) {
    this.holderSelector = holderSelector;

    this.options = {
      slideSelector: ".moon-slide",
      cardSelector: ".moon-card",
      pinnedClass: "moon-card-pinned",
      activeClass: "active",
      cardOffset: 120,
      ...options,
    };

    this.holder = null;
    this.slides = [];
    this.cards = [];

    this.frame = 0;
    this.isActive = false;

    this.holderTop = 0;
    this.pinEnd = 0;

    this.slideTops = [];

    this.currentPhase = null;
    this.cardOffsets = [];

    this.visibilityObserver = null;

    this._onScroll = this.onScroll.bind(this);
    this._onResize = this.onResize.bind(this);
  }

  init() {
    this.holder = document.querySelector(this.holderSelector);

    if (!this.holder) return;

    this.slides = [
      ...this.holder.querySelectorAll(`:scope > ${this.options.slideSelector}`),
    ];

    if (!this.slides.length) return;

    this.collectCards();
    this.recalculate();
    this.observeVisibility();

    window.addEventListener("scroll", this._onScroll, {
      passive: true,
    });

    window.addEventListener("resize", this._onResize);
  }

  collectCards() {
    this.slides.forEach((slide, index) => {
      const current = String(index + 1).padStart(2, "0");
      const total = String(this.slides.length).padStart(2, "0");

      slide.dataset.slide = `${current} / ${total}`;
    });

    this.cards = this.slides
      .map((slide) => slide.querySelector(this.options.cardSelector))
      .filter(Boolean);

    this.cards.forEach((card, index) => {
      card.style.setProperty("--moon-card-index", index + 1);
    });

    this.cardOffsets = new Array(this.cards.length).fill(null);
  }

  observeVisibility() {
    this.visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        this.isActive = entry.isIntersecting;

        if (!this.isActive) {
          this.cancelFrame();
          return;
        }

        this.recalculate();
        this.update();
      },
      {
        rootMargin: "150% 0px",
      },
    );

    this.visibilityObserver.observe(this.holder);
  }

  onScroll() {
    if (!this.isActive || this.frame) return;

    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.update();
    });
  }

  onResize() {
    this.recalculate();

    if (this.isActive) {
      this.update();
    }
  }

  recalculate() {
    if (!this.holder) return;

    this.holderTop = this.holder.getBoundingClientRect().top + window.scrollY;

    this.pinEnd =
      this.holderTop +
      Math.max(0, this.holder.offsetHeight - window.innerHeight);

    this.slideTops = this.slides.map((slide) => slide.offsetTop);

    this.currentPhase = null;
    this.cardOffsets.fill(null);
  }

  update() {
    if (!this.holder || !this.cards.length) return;

    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;

    const phase = this.getPhase(scrollY);

    if (phase !== this.currentPhase) {
      this.currentPhase = phase;
      this.updatePinState(phase);
    }

    this.updateCards(scrollY, viewportHeight);
    this.updateActiveSlide(scrollY, viewportHeight);
  }

  getPhase(scrollY) {
    if (scrollY <= this.holderTop) {
      return PHASE_BEFORE;
    }

    if (scrollY >= this.pinEnd) {
      return PHASE_AFTER;
    }

    return PHASE_PINNED;
  }

  updatePinState(phase) {
    const isPinned = phase === PHASE_PINNED;

    this.cards.forEach((card) => {
      card.classList.toggle(this.options.pinnedClass, isPinned);

      card.style.removeProperty("top");
    });
  }

  updateCards(scrollY, viewportHeight) {
    const { cardOffset } = this.options;

    this.cards.forEach((card, index) => {
      const slideTop = this.holderTop + this.slideTops[index];

      const progress =
        index === 0
          ? 1
          : this.getCardProgress(slideTop, scrollY, viewportHeight);

      const offset = (1 - progress) * cardOffset;

      if (offset === this.cardOffsets[index]) {
        return;
      }

      card.style.setProperty("--moon-card-offset", `${offset}vw`);

      this.cardOffsets[index] = offset;
    });
  }

  updateActiveSlide(scrollY, viewportHeight) {
    const tolerance = 2;

    this.slides.forEach((slide, index) => {
      const slideTop = this.holderTop + this.slideTops[index];

      const distance = Math.abs(scrollY - slideTop);

      slide.classList.toggle(this.options.activeClass, distance <= tolerance);
    });
  }

  getCardProgress(slideTop, scrollY, viewportHeight) {
    return Math.min(
      1,
      Math.max(0, (viewportHeight - (slideTop - scrollY)) / viewportHeight),
    );
  }

  cancelFrame() {
    if (!this.frame) return;

    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  destroy() {
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("resize", this._onResize);

    cancelAnimationFrame(this.frame);
    this.frame = 0;

    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;

    this.cards.forEach((card) => {
      card.classList.remove(this.options.pinnedClass);
      card.style.removeProperty("--moon-card-offset");
      card.style.removeProperty("--moon-card-index");
      card.style.removeProperty("top");
    });

    this.holder = null;
    this.slides = [];
    this.cards = [];
    this.slideTops = [];
    this.cardOffsets = [];
    this.isActive = false;
    this.currentPhase = null;
  }
}

export const moonsScrollAnimation = new MoonsScrollAnimation(".moons-holder");
