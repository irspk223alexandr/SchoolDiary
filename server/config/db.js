const knex = require('knex');
const config = require('./knexfile');

const environment = process.env.NODE_ENV || 'development';
console.log('🔧 Используется окружение:', environment);

module.exports = knex(config[environment]);