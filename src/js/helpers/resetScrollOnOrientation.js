export function resetScrollOnOrientation() {
  const lockQuery = window.matchMedia(
    "(orientation: landscape) and (max-height: 500px) and (hover: none) and (pointer: coarse)",
  );

  let wasLocked = lockQuery.matches;

  lockQuery.addEventListener("change", () => {
    if (wasLocked && !lockQuery.matches) {
      requestAnimationFrame(() => window.scrollTo(0, 0));
    }

    wasLocked = lockQuery.matches;
  });
}
