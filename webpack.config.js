const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  // entry: {
  //   index: './src/index.js',
  //   map_editor: './src/map_editor.js',
  // },
  // output: {
  //   filename: '[name].js',
  //   path: path.resolve(__dirname, 'dist', 'js'),
  // },
  devServer: {
    contentBase: './dist',
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './static', to: './' }
      ]
    }),
  ],
}
