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

  sunCarousel();
}
