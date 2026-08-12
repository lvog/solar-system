module.exports = ({ isProd }) => ({
  plugins: [
    require("autoprefixer")(),
    require("postcss-sort-media-queries")({ sort: "mobile-first" }),
    isProd && require("cssnano")(),
  ].filter(Boolean),
});
