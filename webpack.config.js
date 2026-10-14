const path = require('node:path');
const modernizr = require('modernizr');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const modernizrConfig = require('./modernizr-config.json');

// Builds a custom Modernizr containing only the tests listed in modernizr-config.json
// (here: input types, about 2.4 KB). HtmlWebpackPlugin inlines it into <head>, so the
// feature test runs before first paint and before the deferred app bundle.
function buildModernizr(config) {
  return new Promise((resolve) => modernizr.build(config, resolve));
}

module.exports = async (env = {}, argv = {}) => {
  const isProd = argv.mode === 'production';
  // Content hashes in production: a file name only changes when its content does,
  // so browsers can cache every asset long term.
  const name = isProd ? '[name].[contenthash:8]' : '[name]';

  return {
    mode: isProd ? 'production' : 'development',
    entry: { main: './src/index.js' },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: `js/${name}.js`,
      chunkFilename: `js/${name}.js`,
      assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
      clean: true,
    },
    devtool: isProd ? 'source-map' : 'eval-cheap-module-source-map',
    module: {
      rules: [
        {
          test: /\.css$/i,
          // Production: extract CSS into cacheable files (split per chunk like the JS).
          // Development: inject with <style> tags for fast hot reloading.
          use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader'],
        },
        {
          test: /\.(svg|png|jpe?g|webp)$/i,
          // Small files are inlined as data URIs (one request fewer); larger ones are emitted.
          type: 'asset',
          parser: { dataUrlCondition: { maxSize: 4 * 1024 } },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        favicon: './src/assets/wallet.svg',
        templateParameters: { modernizr: await buildModernizr(modernizrConfig) },
      }),
      isProd &&
        new MiniCssExtractPlugin({
          filename: `css/${name}.css`,
          chunkFilename: `css/${name}.css`,
        }),
      env.analyze &&
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: path.resolve(__dirname, 'bundle-report.html'),
          openAnalyzer: !process.env.CI, // don't pop a browser open on CI machines
        }),
    ].filter(Boolean),
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          // Code from node_modules goes into separate vendor chunks, named after the chunks
          // that use them (e.g. "vendors-month-fallback"). Never give this group one fixed
          // name: that would merge every vendor module into a single chunk loaded on every
          // page, pulling flatpickr (needed only by the lazy fallback) into the first load.
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
            name: (module, chunks) =>
              `vendors-${chunks.map((chunk) => chunk.name).filter(Boolean).join('~') || 'shared'}`,
          },
        },
      },
      // The webpack runtime lives in its own small file, so app changes don't alter vendor hashes.
      runtimeChunk: 'single',
      // '...' keeps the default JS minifier (Terser); CssMinimizerPlugin adds CSS minification.
      minimizer: ['...', new CssMinimizerPlugin()],
    },
    performance: isProd
      ? { hints: 'warning', maxEntrypointSize: 40 * 1024, maxAssetSize: 100 * 1024 }
      : false,
    devServer: {
      port: 8080,
      open: true,
      hot: true,
      static: false,
      client: { overlay: true },
    },
  };
};
