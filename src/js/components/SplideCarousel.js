import Splide from "@splidejs/splide";
import "@splidejs/splide/css";

export function initSplideCarousel() {
  const playOnFirstViewport = (carousel, splide) => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        splide.Components.Autoplay.play();

        observer.unobserve(carousel);
        observer.disconnect();
      },
      {
        threshold: 0.15,
      },
    );

    observer.observe(carousel);
  };

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
        autoplay: false,
        interval: 8000,
      });

      splide.on("mounted", () => {
        current.textContent = String(splide.index + 1).padStart(2, "0");
        total.textContent = String(splide.length).padStart(2, "0");

        playOnFirstViewport(carousel, splide);
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
        pagination: false,
        speed: 2000,
        interval: 9000,
        easing: "ease-in-out",
        autoplay: false,
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

          splide.Components.Autoplay.play();

          const current = splide.Components.Slides.getAt(splide.index);

          if (current) {
            runOnce(current);
          }

          observer.unobserve(carousel);
          observer.disconnect();
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
