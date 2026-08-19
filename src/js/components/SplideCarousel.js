import Splide from "@splidejs/splide";
import "@splidejs/splide/css";

export function initSplideCarousel() {
  const sunCarousel = () => {
    const carousels = document.querySelectorAll(".sun-splide");

    if (!carousels.length) return;

    carousels.forEach((carousel) => {
      const holder = carousel.closest(".splide-holder");

      const current = holder.querySelector(".splide-counter__current");
      const total = holder.querySelector(".splide-counter__total");
      const progressBar = holder.querySelector(".splide-progress__bar");

      const splide = new Splide(carousel, {
        type: "fade",
        rewind: true,
        arrows: false,
        pagination: false,
        speed: 2000,
        autoplay: true,
        interval: 7000,
      });

      splide.on("mounted", () => {
        current.textContent = String(splide.index + 1).padStart(2, "0");
        total.textContent = String(splide.length).padStart(2, "0");
      });

      splide.on("moved", (newIndex) => {
        current.textContent = String(newIndex + 1).padStart(2, "0");
      });

      splide.on("autoplay:playing", (rate) => {
        progressBar.style.transform = `scaleX(${rate})`;
      });

      splide.mount();
    });
  };

  const planetsCarousel = () => {
    const carousels = document.querySelectorAll(".planets-splide");

    if (!carousels.length) return;

    carousels.forEach((carousel) => {
      const splide = new Splide(carousel, {
        type: "fade",
        perPage: 1,
        arrows: false,
        speed: 1000,
        autoplay: false,
        pagination: false,
        easing: "ease-in-out",
        autoplay: true,
        rewind: true,
      });

      let isVisible = false;

      const runOnce = (slide) => {
        if (!isVisible) return;

        const slideEl = slide.slide;

        if (slideEl.classList.contains("in-viewport")) return;

        slideEl.classList.add("in-viewport");
      };

      splide.on("active", (slide) => {
        runOnce(slide);
      });

      splide.mount();

      const observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;

          if (!isVisible) return;

          const current = splide.Components.Slides.getAt(splide.index);

          if (current) {
            runOnce(current);
          }
        },
        {
          threshold: 0.15,
        },
      );

      observer.observe(carousel);
    });
  };

  sunCarousel();
  planetsCarousel();
}
