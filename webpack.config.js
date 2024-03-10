const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = () => {
  configs = {
    entry: './src/index.ts',
    target: 'web',
    externals: [nodeExternals()],
    devtool: false,
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      modules: [path.resolve(__dirname, 'src')],
    },
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
      libraryTarget: 'umd',
      umdNamedDefine: true,
      globalObject: 'this'
    },
    optimization: {
      minimize: true,
    },
  };

  return configs;
}
