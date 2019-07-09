module.exports = {
    entry: './script.js',
    output: { filename: 'bundle.js' },
    plugins: [],
    module: {
      loaders: [
        {
          test: /.js?$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          query: {
            presets: ['es2015', 'react', [
              'jsxz',
              {
                  dir: 'webflow'
              }
          ]]
          }
        }
      ]
    },
  }