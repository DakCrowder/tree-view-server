const Sequelize = require('sequelize')
const Op = Sequelize.Op;
const FactoryModel = require('./models/factory')
const NodeModel = require('./models/node')
const RootModel = require('./models/root')

const sequelize = new Sequelize('tree_view', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
})

sequelize
  .authenticate()
  .then(() => {
  console.log('Connection has been established successfully.');
})
.catch(err => {
  console.error('Unable to connect to the database:', err);
});

const Root = RootModel(sequelize, Sequelize)
const Factory = FactoryModel(sequelize, Sequelize)
const Node = NodeModel(sequelize, Sequelize)

Root.hasMany(Factory, {onDelete: 'CASCADE'})
Factory.hasMany(Node, {onDelete: 'CASCADE'})

// TODO remove force: true, this should be used for local dev only { force: true }
sequelize.sync()
  .then(() => {
  console.log(`Database synced`)
})

module.exports = {
  Root,
  Factory,
  Node,
  Op,
}