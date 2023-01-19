//GULP Modules
const { src, dest, watch, parallel, series } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const browserSync = require("browser-sync").create();
const autoprefixer = require("gulp-autoprefixer");
const image = require("gulp-imagemin");
const del = require("del");
const fileinclude = require("gulp-file-include");

const webpack = require("webpack");
const webpackStream = require("webpack-stream");
const webpackConfig = require("./webpack.config.js");

const babel = require("gulp-babel");
const settings = require("./settings.js");
//Settings Path
const settingsPath = settings.path;

function html() {
  return src(_routesBuild(settingsPath.routesPath))
    .pipe(fileinclude())
    .pipe(dest(`${settingsPath.mainSourceRoot}/`))
    .pipe(browserSync.stream());
}

function styles() {
  return src(
    `${settingsPath.mainSourceRoot}/${settingsPath.mainIndexRoot}/styles.scss`
  )
    .pipe(
      sass({
        outputStyle: "compressed",
      }).on("error", sass.logError)
    )
    .pipe(concat("style.min.css"))
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 10 version"],
        grid: true,
      })
    )
    .pipe(
      dest(`${settingsPath.mainSourceRoot}/${settingsPath.assetsRoot}/css/`)
    )
    .pipe(browserSync.stream());
}

function script() {
  return src([`${settingsPath.mainSourceRoot}/index.js`])
    .pipe(webpackStream(webpackConfig), webpack)
    .pipe(dest(`${settingsPath.mainSourceRoot}/${settingsPath.assetsRoot}/js/`))
    .pipe(
      babel({
        presets: ["@babel/env"],
      })
    )
    .pipe(browserSync.stream());
}

function images() {
  return src([
    `${settingsPath.mainSourceRoot}/${settingsPath.assetsRoot}/images/**/*`,
  ])
    .pipe(
      image([
        image.gifsicle({ interlaced: true }),
        image.mozjpeg({ quality: 75, progressive: true }),
        image.optipng({ optimizationLevel: 5 }),
        image.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(
      dest(`${settingsPath.buildProdRoot}/${settingsPath.assetsRoot}/images/`)
    );
}

function cleanDist() {
  return del(`${settingsPath.buildProdRoot}`);
}

function browsersync() {
  browserSync.init({
    server: {
      baseDir: `${settingsPath.mainSourceRoot}/`,
    },
  });
}

function build() {
  return src(
    [
      `${settingsPath.mainSourceRoot}/${settingsPath.assetsRoot}/css/style.min.css`,
      `${settingsPath.mainSourceRoot}/${settingsPath.assetsRoot}/js/script.min.js`,
      `${settingsPath.mainSourceRoot}/${settingsPath.assetsRoot}/js/libs/*.js`,
      `${settingsPath.mainSourceRoot}/${settingsPath.assetsRoot}/fonts/**/*`,
      `${settingsPath.mainSourceRoot}/*.html`,
    ],
    { base: `${settingsPath.mainSourceRoot}` }
  ).pipe(dest(`${settingsPath.buildProdRoot}`));
}

function watching() {
  // Watch SCSS
  watch(
    [
      `${settingsPath.mainSourceRoot}/${settingsPath.scssRoot}/*.scss`,
      `${settingsPath.mainSourceRoot}/${settingsPath.mainIndexRoot}/sections/**/*.scss`,
      `${settingsPath.mainSourceRoot}/${settingsPath.mainIndexRoot}/*.scss`,
      `${settingsPath.mainSourceRoot}/${settingsPath.mainIndexRoot}/ui-kit/*.scss`,

      `${settingsPath.mainSourceRoot}/${settingsPath.routesRoot}/**/*.scss`,
      `${settingsPath.mainSourceRoot}/${settingsPath.routesRoot}/**/**/**/*.scss`,
    ],
    styles
  );
  // Watch HTML include
  watch(
    [
      `${settingsPath.mainSourceRoot}/${settingsPath.mainIndexRoot}/sections/**/*.html`,
      `${settingsPath.mainSourceRoot}/${settingsPath.mainIndexRoot}/*.html`,
      `${settingsPath.mainSourceRoot}/${settingsPath.routesRoot}/**/*.html`,
      `${settingsPath.mainSourceRoot}/${settingsPath.routesRoot}/**/**/**/*.html`,
    ],
    html
  );
  // Watch HTML
  watch([`${settingsPath.mainSourceRoot}/*.html`]).on(
    `change`,
    browserSync.reload
  );
  // Watch JS
  watch(
    [
      `${settingsPath.mainSourceRoot}/index.js`,
      `${settingsPath.mainSourceRoot}/${settingsPath.mainIndexRoot}/components/*.js`,
      `${settingsPath.mainSourceRoot}/${settingsPath.mainIndexRoot}/*.js`,
    ],
    script
  );
}

function _routesBuild(routes) {
  const src = [
    `${settingsPath.mainSourceRoot}/${settingsPath.mainIndexRoot}/index.html`,
  ];

  for (let route of routes) {
    src.push(
      `${settingsPath.mainSourceRoot}/${settingsPath.routesRoot}/${route.name}/${route.name}.html`
    );
  }

  return src;
}

exports.styles = styles;
exports.watching = watching;
exports.browsersync = browsersync;
exports.script = script;
exports.images = images;
exports.cleanDist = cleanDist;
exports.html = html;
exports.build = series(cleanDist, images, build);
exports.default = parallel(html, styles, script, browsersync, watching);
