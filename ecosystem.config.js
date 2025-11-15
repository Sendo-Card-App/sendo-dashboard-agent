module.exports = {
  apps: [
    {
      name: 'Sendo Agent',
      script: 'ng',
      args: 'serve --host 0.0.0.0 --port 4300',
      watch: true,
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      },
      node_args: '--max-old-space-size=1024'
    }
  ]
};
