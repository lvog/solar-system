const path = require("path");
const fs = require("fs");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ImageMinimizerPlugin = require("image-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");

const PATHS = {
  src: path.resolve(__dirname, "src"),
  dist: path.resolve(__dirname, "dist"),
  pages: path.resolve(__dirname, "src/pages"),
  js: path.resolve(__dirname, "src/js"),
  images: path.resolve(__dirname, "src/images"),
};

const getPostcssConfig = require("./postcss.config");

const isHTML = (file) => file.endsWith(".html");

// HTML
const getHtmlPlugins = () => {
  const htmlFiles = fs.readdirSync(PATHS.pages).filter(isHTML);

  return htmlFiles.map(
    (file) =>
      new HtmlWebpackPlugin({
        filename: file,
        template: path.resolve(PATHS.pages, file),
        inject: "body",
        minify: false,
        scriptLoading: "defer",
      }),
  );
};

const getPlugins = ({ isDev, isProd }) =>
  [
    ...getHtmlPlugins(),

    // CSS
    isProd &&
      new MiniCssExtractPlugin({
        filename: "css/[name].min.css",
      }),

    // Copy images
    isProd &&
      new CopyWebpackPlugin({
        patterns: [
          {
            from: PATHS.images,
            to: path.resolve(PATHS.dist, "images"),
          },
        ],
      }),

    // Optimize images
    isProd &&
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.sharpMinify,
          options: {
            encodeOptions: {
              jpeg: { quality: 75 },
              png: { quality: 80 },
              webp: { quality: 75 },
            },
          },
        },
      }),

    // ESLint
    new ESLintPlugin({
      extensions: ["js"],
      context: PATHS.js,
      emitWarning: isDev,
      emitError: isProd,
      failOnError: isProd,
      overrideConfigFile: path.resolve(__dirname, ".eslintrc.js"),
      configType: "eslintrc",
    }),
  ].filter(Boolean);

const getOptimization = ({ isProd }) => ({
  minimize: isProd,
  minimizer: isProd
    ? [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            compress: { drop_console: true },
            format: { comments: false },
          },
        }),
      ]
    : [],
});

const getDevServer = () => ({
  host: "0.0.0.0",
  port: 3000,
  hot: true,
  compress: true,
  open: true,
  client: {
    logging: "none",
    overlay: { warnings: false, errors: true },
  },
  static: { directory: PATHS.src },
});

const getModuleRules = ({ isDev, isProd }) => [
  // JS (Babel)
  {
    test: /\.m?js$/,
    exclude: /node_modules/,
    use: "babel-loader",
  },

  {
    test: /\.css$/i,
    use: [isDev ? "style-loader" : MiniCssExtractPlugin.loader, "css-loader"],
  },

  // SCSS
  {
    test: /\.s[ac]ss$/i,
    use: [
      isDev ? "style-loader" : MiniCssExtractPlugin.loader,
      "css-loader",
      {
        loader: "postcss-loader",
        options: {
          postcssOptions: getPostcssConfig({ isProd }),
          sourceMap: isDev,
        },
      },
      {
        loader: "sass-loader",
        options: {
          sourceMap: isDev,
          sassOptions: {
            loadPaths: [path.resolve(PATHS.src, "styles")],
          },
        },
      },
    ],
  },

  // Images
  {
    test: /\.(png|jpe?g|gif|svg|webp)$/i,
    type: "asset/resource",
    generator: { filename: "images/[name][ext]" },
  },

  // Fonts
  {
    test: /\.(woff2?|eot|ttf|otf)$/i,
    type: "asset/resource",
    generator: { filename: "fonts/[name][ext]" },
  },
];

module.exports = (env = {}) => {
  const isDev = env.mode === "development";
  const isProd = !isDev;

  return {
    mode: isDev ? "development" : "production",

    cache: { type: "filesystem" },

    entry: path.resolve(PATHS.js, "app.js"),

    output: {
      path: PATHS.dist,
      filename: "js/[name].js",
      // clean: true,
    },

    resolve: {
      alias: {
        "@js": PATHS.js,
      },
    },

    devtool: isDev ? "source-map" : false,

    plugins: getPlugins({ isDev, isProd }),

    optimization: getOptimization({ isProd }),

    devServer: isDev ? getDevServer() : undefined,

    module: {
      rules: getModuleRules({ isDev, isProd }),
    },

    stats: "minimal",
  };
};
