module.exports = function override(config, env) {
  // Fix ESM "fully specified" import issues with MUI
  config.resolve = {
    ...config.resolve,
    fullySpecified: false,
    extensionAlias: {
      '.js': ['.js', '.jsx', '.ts', '.tsx']
    }
  };
  
  // Ensure imports without extensions work properly
  config.module = config.module || {};
  config.module.rules = config.module.rules || [];
  
  // Find any existing JavaScript rule
  const jsRule = config.module.rules.find(
    rule => rule.test && rule.test.toString().includes('js')
  );

  if (jsRule) {
    // Ensure it has the correct resolve configuration
    jsRule.resolve = {
      ...jsRule.resolve,
      fullySpecified: false
    };
  }
  
  // Add handling for .mjs files and MUI packages
  config.module.rules.push({
    test: /\.m?js$/,
    include: /node_modules(\/|\\)(@mui|@emotion)/,
    resolve: {
      fullySpecified: false
    }
  });
  
  // Add webpack dev server configuration
  if (env === 'development') {
    config.devServer = {
      ...config.devServer,
      allowedHosts: 'all',
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/standards-api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/auth': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/users': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
        '/compliance': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    }
  }
  
  return config;
}; 