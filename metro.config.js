const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@supabase/functions-js') {
    return context.resolveRequest(
      context,
      '@supabase/functions-js/dist/main/index.js',
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
