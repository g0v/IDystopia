/* eslint-env node */

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'web',
  entry: {
    index: './src/js/index.js',
    index_clab: './src/js/index_clab.js',
    show_stat: './src/js/show_stat.js',
    online_event: './src/js/online_event.js',
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    contentBase: './dist',
  },
  devtool: 'source-map',
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './static', to: './' }
      ]
    }),
  ],
}
