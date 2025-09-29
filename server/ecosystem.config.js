module.exports = {
  apps: [{
    name: 'linkhub-server',
    script: 'src/server.js',
    cwd: '/root/LinkHub/server',

    // Environment
    env: {
      NODE_ENV: 'development',
      PORT: 3001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    },

    // Process management
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',

    // Logging
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    log_file: '/tmp/linkhub/logs/pm2-combined.log',
    out_file: '/tmp/linkhub/logs/pm2-out.log',
    error_file: '/tmp/linkhub/logs/pm2-error.log',

    // Advanced features
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Monitoring
    monit: true
  }],

  deploy: {
    production: {
      user: 'root',
      host: ['localhost'],
      ref: 'origin/master',
      repo: 'https://github.com/mykernel/LinkHub.git',
      path: '/root/LinkHub',
      'post-deploy': 'cd server && npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};