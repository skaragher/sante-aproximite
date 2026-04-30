module.exports = {
  apps: [
    {
      name: "sante-aproxmite-api",
      cwd: "/var/www/sante-aproximite/backend",
      script: "src/server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 8081
      }
    }
  ]
};
