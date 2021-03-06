var path = require("path");
var webpack = require("webpack");
var AssetsPlugin = require('assets-webpack-plugin');

// Ensure a FRONTEND_HOST is setup since we embed it in the assets.json file
if(!process.env.FRONTEND_HOST) {
  throw "No FRONTEND_HOST set";
}

// Ensure a NODE_ENV is also present
if(!process.env.NODE_ENV) {
  throw "No NODE_ENV set";
}

// The FRONTEND_HOST must end with a /
if(process.env.FRONTEND_HOST.slice(-1) != "/") {
  throw "FRONTEND_HOST must end with a /";
}

// Include a hash of the bundle in the name when we're building these files for
// production so we can use non-expiring caches for them.
//
// Also, if we used hashes in development, we'd be forever filling up our dist
// folder with every hashed version of files we've changed (webpack doesn't
// clean up after itself)
var filenameFormat
var chunkFilename
if(process.env.NODE_ENV == "production") {
  filenameFormat = "[name]-[chunkhash].js"
  chunkFilename = "[id]-[chunkhash].js"
} else {
  filenameFormat = "[name].js"
  chunkFilename = "[id].js"
}

// Toggle between the devtool if on prod/dev since cheap-module-eval-source-map
// is way faster for development.
var devTool
if(process.env.NODE_ENV == "production") {
  devTool = "source-map"
} else {
  devTool = "cheap-module-eval-source-map"
}

var plugins = [
  // Only add the 'whatwg-fetch' plugin if the browser doesn't support it
  new webpack.ProvidePlugin({ 'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch' }),

  // Split emojis, vendor javascript up. The loader JS doesn't have any modules
  // inside it, but since it's the last one, that's where Webpack will dump all
  // of it's bootstrapping JS. This file will change on every compilation.
  new webpack.optimize.CommonsChunkPlugin({ names: [ "emojis", "vendor", "loader" ], chunks: [ "emojis", "vendor", "loader" ] }),

  // After Webpack compilation, spit out a 'manifest.json' file with a mapping
  // of file name, to compiled name.
  new AssetsPlugin({
    path: path.join(__dirname, '..', 'dist'),
    filename: 'manifest.json'
  }),

  // By default, Webpack uses numerical ID's for it's internal module
  // identification. When you add a module, everything gets shift by 1, which
  // means you end up having a different 'vendor.js' file, if you changed a
  // module in 'app.js', since all the ID's are now +1. NamedModulesPlugin uses
  // the name of the plugin instead of a id, the only problem with this, is
  // that it bloats file size, because instead of "1" being the ID, it's now
  // "../../node_modules/react/index.js" or something. In saying that though,
  // after gzipping, it's not a real problem.
  new webpack.NamedModulesPlugin(),

  // Ensures only moments "en" package is included (saves 200kb in final compilation)
  new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),

  // When you set NODE_ENV=production, that only sets it for the Webpack NodeJS
  // environment. We need to also send the variable to the JS compilation
  // inside Babel, so packages like React know now to include development
  // helpers. Doing this greatly reduces file size, and makes React faster
  // since it doesn't have to do a ton of type checking (which it only does to
  // help developers with error messages)
  new webpack.DefinePlugin({
    'process.env': {
      'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }
  })
]

// If we're building for production, minify the JS
if(process.env.NODE_ENV == "production") {
  // Need this plugin to ensure consistent module ordering so we can have
  // determenistic filename hashes
  plugins.push(new webpack.optimize.OccurenceOrderPlugin(true));

  // You're basic, run-of-the-mill, JS uglifier
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    output: {
      comments: false
    },
    compress: {
      warnings: false,
      screw_ie8: true
    }
  }));
}

module.exports = {
  context: __dirname,

  devtool: devTool,

  entry: {
    vendor: ["classnames", "react", "react-dom", "react-relay", "react-router",
      "react-router-relay", "history", "graphql", "graphql-relay",
      "moment", "object-assign", "eventemitter3", "pusher-js",
      "whatwg-fetch", "es6-error", "escape-html", "react-addons-update",
      "react-document-title", "bugsnag-js", "deepmerge", "react-addons-pure-render-mixin"],
    emojis: [ path.join(__dirname, './../app/emojis/buildkite.js'), path.join(__dirname, './../app/emojis/apple.js') ],
    app: path.join(__dirname, './../app/app.js'),
    public: path.join(__dirname, './../app/public.js')
  },

  output: {
    filename: filenameFormat,
    chunkFilename: chunkFilename,
    path: path.join(__dirname, '..', 'dist'),
    publicPath: process.env.FRONTEND_HOST
  },

  module: {
    loaders: [
      {
        test: /\.css$/i,
        loader: "style-loader!css-loader!postcss-loader"
      },
      {
        test: /\.js$/i,
        loader: 'babel',
        exclude: /node_modules/
      },
      {
        test: /\.(woff)$/i,
        loader: 'url-loader?limit=8192'
      },
      {
        test: /\.(png|svg|jpg|gif)$/i,
        loaders: [
          'url-loader?limit=8192',
          'image-webpack?optimizationLevel=7&interlaced=false'
        ]
      }
    ]
  },

  plugins: plugins,

  postcss: function (webpack) {
    return [
      require("postcss-import")({ addDependencyTo: webpack }),
      // require("postcss-url")(),
      require("postcss-cssnext")({ features: { rem: false } }),
      require('postcss-easings')(),
      // add your "plugins" here
      // ...
      // and if you want to compress,
      // just use css-loader option that already use cssnano under the hood
      require("postcss-browser-reporter")(),
      require("postcss-reporter")()
    ]
  }
}
