const express = require('express');
const webpack = require('webpack');
const fs = require('fs');
const url = require('url');
const path = require('path');
const Ssi = require('ssi');
const opn = require('opn');
const config = require('../config');

const app = express();
const webpackConfig = require('./webpack.dev');

const port = process.env.PORT || config.dev.port;

// SSI midleware
app.use((req, res, next) => {
  const baseDir = webpackConfig.output.path;
  const ext = '.shtm';
  const parser = new Ssi(baseDir, baseDir, `/**/*${ext}`);
  const { pathname } = url.parse(req.originalUrl || req.url);
  const filename = path.join(baseDir, pathname.substr(-1) === '/' ? `${pathname}index${ext}` : pathname);

  if (filename.indexOf(ext) > -1 && fs.existsSync(filename)) {
    const { contents } = parser.parse(filename, fs.readFileSync(filename, {
      encoding: 'utf8',
    }));


    res.writeHead(200, {
      'Content-Type': 'text/html',
    });
    res.end(contents);
  } else {
    next();
  }
});

const compiler = webpack(webpackConfig);

const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true,
});

const hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: false,
  path: '/__webpack_hmr',
  heartbeat: 2000,
});

compiler.hooks.compilation.tap('html-webpack-plugin-after-emit', () => {
  hotMiddleware.publish({
    action: 'reload',
  });
});

app.use(devMiddleware);

app.use(hotMiddleware);


const uri = `http://localhost:${port}`;

let _resolve;
const readyPromise = new Promise((resolve) => {
  _resolve = resolve;
});

console.log('> Starting dev server...');
devMiddleware.waitUntilValid(() => {
  console.log(`> Listening at ${uri}\n`);
  // when env is testing, don't need open it
  if (process.env.NODE_ENV !== 'test') {
    opn(uri);
  }
  _resolve();
});

const server = app.listen(port);

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close();
  },
};
