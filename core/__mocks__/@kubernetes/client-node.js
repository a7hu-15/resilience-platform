module.exports = {
  KubeConfig: class { 
    loadFromDefault() {} 
    makeApiClient() { return {}; } 
  },
  CoreV1Api: class {},
  AppsV1Api: class {}
};
