const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const eslintFriendlyFormatter = require('eslint-friendly-formatter');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const glob = require('glob');
const config = require('../config');

const resolve = dir => path.join(__dirname, '..', dir);

const setHTMLFiles = ({ root }) => {
  const rootFiles = glob.sync(`${root}/*.{htm,html,shtm,shtml}`);
  const rootHTMLFiles = rootFiles.map((file) => {
    const filename = path.basename(file);
    return new HtmlWebpackPlugin({
      filename,
      template: file,
      alwaysWriteToDisk: true,
    });
  });

  const includeFiles = glob.sync(`${root}/inc/**/*.{htm,html,shtm,shtml}`);
  const includeHTMLFiles = includeFiles.map(file => new HtmlWebpackPlugin({
    filename: path.relative(root, file),
    template: file,
    inject: false,
    alwaysWriteToDisk: true,
  }));

  return [
    ...rootHTMLFiles,
    ...includeHTMLFiles,
  ];
};

const changeSiteURL = (branch) => {
  if (branch === 'stage') {
    return process.env.PIPELINES_URL_HOMOLOGATION;
  } else if (branch === 'master') {
    return process.env.PIPELINES_URL_PRODUCTION;
  }

  return 'http://localhost:3000';
};

module.exports = {
  entry: {
    polyfills: ['babel-polyfill'],
    main: ['./src/js/main.js', './src/sass/main.scss'],
    vendors: ['./src/sass/vendors.scss'],
  },
  output: {
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].js',
    path: config.build.assetsRoot,
    publicPath: process.env.NODE_ENV === 'production'
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath,
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [resolve('src'), resolve('test')],
        options: {
          formatter: eslintFriendlyFormatter,
        },
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(ttf|eot|woff|woff2|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/',
          },
        },
        exclude: resolve('src/svg'),
      },
      {
        test: /\.(jpe?g|png|gif|ico)$/i,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
        },
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]',
              outputPath: 'svg/',
            },
          },
        ],
        exclude: [/\.\/(font(s)?)\//, /[\\/]node_modules[\\/]/],
      },
      {
        test: /\.pdf$/i,
        use: {
          loader: 'file-loader',
          options: {
            limit: 30 * 1024,
            name: '[name].[ext]',
            outputPath: 'pdf/',
          },
        },
      },
      {
        test: /\.(mp4|ogv|webm|mov|ogg|mpe?g)$/i,
        use: {
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'videos/',
          },
        },
      },
      {
        test: /\.(s)?htm(l)?$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              attrs: [':poster', ':href', ':src', ':data-content'],
              interpolate: true,
            },
          },
          {
            loader: StringReplacePlugin.replace({
              replacements: [
                {
                  pattern: /http:\/\/localhost/ig,
                  replacement(match, p1) {
                    return changeSiteURL(process.env.BITBUCKET_BRANCH, match, p1);
                  },
                },
              ],
            }),
          },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(['dist'], {
      root: `${__dirname}/../`,
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
      chunkFilename: 'css/[name].css',
    }),
    new StringReplacePlugin(),
    ...setHTMLFiles({ root: 'src/' }),
  ],
};
