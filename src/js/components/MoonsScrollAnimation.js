class MoonsScrollAnimation {
  constructor(holderSelector, options = {}) {
    this.holderSelector = holderSelector;
    this.options = {
      slideSelector: ".moon-slide",
      cardSelector: ".moon-card",
      ...options,
    };

    this.holder = null;
    this.stage = null;
    this.slides = [];
    this.cards = [];
    this.frame = 0;
    this.isActive = false;
    this.holderTop = 0;
    this.maxStageOffset = 0;
    this.slideTops = [];
    this.lastStageOffset = null;
    this.lastCardOffsets = [];
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

    this.createStage();
    this.recalculate();
    this.observeVisibility();

    window.addEventListener("scroll", this._onScroll, { passive: true });
    window.addEventListener("resize", this._onResize);
  }

  destroy() {
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("resize", this._onResize);
    cancelAnimationFrame(this.frame);
    this.visibilityObserver?.disconnect();
  }

  createStage() {
    this.stage = document.createElement("div");
    this.stage.className = "moons-stage";
    this.holder.prepend(this.stage);

    this.cards = this.slides
      .map((slide) => slide.querySelector(this.options.cardSelector))
      .filter(Boolean);

    this.cards.forEach((card, index) => {
      card.style.setProperty("--moon-card-index", index + 1);
      this.stage.append(card);
    });
  }

  onScroll() {
    if (!this.isActive) return;

    if (!this.frame) {
      this.frame = requestAnimationFrame(() => this.update());
    }
  }

  onResize() {
    this.recalculate();
    if (this.isActive) this.update();
  }

  observeVisibility() {
    this.visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        this.isActive = entry.isIntersecting;
        if (!this.isActive) return;

        this.recalculate();
        this.update();
      },
      { rootMargin: "150% 0px" },
    );

    this.visibilityObserver.observe(this.holder);
  }

  recalculate() {
    this.holderTop = this.holder.getBoundingClientRect().top + window.scrollY;
    this.maxStageOffset = Math.max(
      0,
      this.holder.offsetHeight - this.stage.offsetHeight,
    );
    this.slideTops = this.slides.map(
      (slide) => this.holderTop + slide.offsetTop,
    );
    this.lastStageOffset = null;
    this.lastCardOffsets = [];
  }

  update() {
    this.frame = 0;
    const scrollY = window.scrollY;
    const viewportHeight = window.innerHeight;
    const stageOffset = Math.max(
      0,
      Math.min(scrollY - this.holderTop, this.maxStageOffset),
    );

    this.updateStagePosition(stageOffset);
    this.updateCards(scrollY, viewportHeight);
  }

  updateStagePosition(offset) {
    if (offset === this.lastStageOffset) return;

    this.stage.style.transform = `translate3d(0, ${offset}px, 0)`;
    this.lastStageOffset = offset;
  }

  updateCards(scrollY, viewportHeight) {
    this.cards.forEach((card, index) => {
      const progress =
        index === 0
          ? 1
          : Math.max(
              0,
              Math.min(
                1,
                (viewportHeight - (this.slideTops[index] - scrollY)) /
                  viewportHeight,
              ),
            );
      const offset = (1 - progress) * 120;

      if (offset === this.lastCardOffsets[index]) return;

      card.style.setProperty("--moon-card-offset", `${offset}vw`);
      this.lastCardOffsets[index] = offset;
    });
  }
}

export const moonsScrollAnimation = new MoonsScrollAnimation(".moons-holder");
