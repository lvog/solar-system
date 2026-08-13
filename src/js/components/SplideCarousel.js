import Splide from "@splidejs/splide";
import "@splidejs/splide/css";

class SplideCarousel {
  constructor() {
    this.selector = ".sun-splide";
    this.instances = [];
  }

  init() {
    const carousels = document.querySelectorAll(this.selector);

    if (!carousels.length) {
      return;
    }

    carousels.forEach((element) => {
      const slider = new Splide(element, {
        type: "fade",
        rewind: true,
        arrows: false,
        pagination: false,
        speed: 2000,
        autoplay: true,
      });

      slider.mount();

      this.instances.push(slider);
    });
  }
}

export default new SplideCarousel();
