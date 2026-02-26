// PM2 設定ファイル - MIERU PX
// 使用方法: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'mieru-clinic',
      cwd: '/var/www/9253',
      script: 'node_modules/.bin/next',
      args: 'start -p 9253',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 9253,
      },
    },
  ],
};
