const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  devServer: {
    host: '121.5.59.140',
    https: true,
    proxy: {
      '/models': {
        target: 'http://121.5.59.140:3000',
      },
    },
  },
  mode: 'development',
  entry: {
    index: path.resolve(__dirname, 'src', 'index.jsx'),
    batch: path.resolve(__dirname, 'src', 'batch.jsx'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
  },
  target: 'web',
  module: {
    rules: [
      {
        test: /workers\/.*\.js$/,
        loader: 'worker-loader',
        options: {
          name: '[name].[contenthash].[ext]',
        },
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          babelrc: true,
        },
      },
      {
        test: /.wasm$/,
        type: 'javascript/auto',
        loader: 'file-loader',
        options: {
          publicPath: '',
          name: '[name].[hash].[ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src', 'index.html'),
      chunks: ['index'],
    }),
    new HtmlWebpackPlugin({
      filename: 'batch.html',
      template: path.resolve(__dirname, 'src', 'batch.html'),
      chunks: ['batch'],
    }),
  ],
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.js', '.jsx'],
  },
};
