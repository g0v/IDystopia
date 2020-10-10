/* eslint-env node */

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  target: 'web',
  entry: {
    index: './src/js/index.js',
    show_stat: './src/js/show_stat.js',
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    contentBase: './dist',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    }
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
