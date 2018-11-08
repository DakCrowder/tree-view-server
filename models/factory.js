module.exports = (sequelize, type) => {
  return sequelize.define('factory', {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: type.STRING,
    lowerBound: type.INTEGER,
    upperBound: type.INTEGER
  })
}