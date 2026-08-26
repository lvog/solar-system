import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger);

class TextAnimation {
  constructor() {
    this.elements = document.querySelectorAll(".split");
  }

  init() {
    document.fonts.ready.then(() => {
      this.elements.forEach((el) => {
        const split = new SplitText(el, { type: "lines" });

        gsap.from(split.lines, {
          opacity: 0,
          y: 24,
          delay: 0.3,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
          },
          onComplete: () => split.revert(),
        });
      });
    });
  }
}

export const textAnimation = new TextAnimation();
