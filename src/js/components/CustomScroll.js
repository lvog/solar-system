import { OverlayScrollbars } from "overlayscrollbars";

import "overlayscrollbars/overlayscrollbars.css";

class CustomScroll {
  constructor(options = {}) {
    this.options = {
      autoHide: "scroll",
      autoHideDelay: 800,
      ...options,
    };

    this.instance = null;
  }

  init() {
    if (window.matchMedia("(pointer: coarse)").matches) {
      return;
    }

    if (this.instance) return;

    this.instance = OverlayScrollbars(document.body, {
      scrollbars: {
        autoHide: this.options.autoHide,
        autoHideDelay: this.options.autoHideDelay,
      },
    });
  }

  destroy() {
    if (!this.instance) return;

    this.instance.destroy();
    this.instance = null;
  }
}

export const customScroll = new CustomScroll();
