import "../styles/style.scss";

import { sunPlasmaScene } from "@js/components/SunPlasmaScene";
import { sunScroll } from "@js/components/SunScrollAnimation";
import { viewportObserver } from "@js/components/InViewportObserver";
import { smoothScroll } from "@js/components/SmoothScroll";

document.addEventListener("DOMContentLoaded", () => {
  smoothScroll.init();
  sunPlasmaScene.init();
  sunScroll.init();
  viewportObserver.init();
});
