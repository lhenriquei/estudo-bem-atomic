const merge = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const commonWebpackConfig = require('./webpack.common.js');
const webpack = require('webpack');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const config = require('../config');


// add hot-reload related code to entry chunks
Object.keys(commonWebpackConfig.entry).forEach((name) => {
  commonWebpackConfig.entry[name] = ['./build/dev-client'].concat(commonWebpackConfig.entry[name]);
});

module.exports = merge(commonWebpackConfig, {

  mode: 'development',
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '../',
            },
          },
          'css-loader',
          'postcss-loader',
          'sass-loader',
        ],
      },
    ],
  },
  devtool: '#cheap-module-eval-source-map',
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
    new webpack.DefinePlugin({
      'process.env': config.dev.env,
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new HtmlWebpackHarddiskPlugin(),
    new FriendlyErrorsPlugin(),
  ],
});
