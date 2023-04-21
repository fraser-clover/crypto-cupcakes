const {Sequelize, sequelize} = require('./db');

const Cupcake = sequelize.define('cupcake', {
  title: Sequelize.STRING,
  flavor: Sequelize.STRING,
  stars: Sequelize.INTEGER,
  userId: Sequelize.STRING
});

module.exports = { Cupcake };
