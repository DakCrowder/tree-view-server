module.exports = (sequelize, type) => {
  return sequelize.define('root', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    }
  })
}