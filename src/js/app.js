import "../styles/style.scss";

import { resetScrollOnOrientation } from "@js/helpers/resetScrollOnOrientation";

import { sunPlasmaScene } from "@js/components/SunPlasmaScene";
import { sunScroll } from "@js/components/SunScrollAnimation";
import { viewportObserver } from "@js/components/InViewportObserver";
import { smoothScroll } from "@js/components/SmoothScroll";
import { initSplideCarousel } from "@js/components/SplideCarousel";
import { moonsScrollAnimation } from "@js/components/MoonsScrollAnimation";
import { particles } from "@js/components/Particles";
import { customScroll } from "@js/components/CustomScroll";
import { textAnimation } from "@js/components/TextAnimation";

document.addEventListener("DOMContentLoaded", () => {
  resetScrollOnOrientation();

  customScroll.init();
  smoothScroll.init();
  sunPlasmaScene.init();
  sunScroll.init();
  viewportObserver.init();
  initSplideCarousel();
  moonsScrollAnimation.init();
  particles.init();
  textAnimation.init();
});
