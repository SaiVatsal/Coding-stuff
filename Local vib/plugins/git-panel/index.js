export default {
  name: 'Git Panel',
  version: '1.0.0',
  icon: '🐙',
  panel: window.NitroCodeComponents?.GitPanel || null,
  onLoad: (api) => {
    console.log('Git Panel plugin loaded');
  }
};
