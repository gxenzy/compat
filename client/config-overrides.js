module.exports = function override(config) {
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
  
  // Add handling for .mjs files
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false
    }
  });
  
  return config;
}; 