module.exports = (sequelize, type) => {
  return sequelize.define('node', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    number: type.INTEGER,
  })
}