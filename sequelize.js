const Sequelize = require('sequelize')
const Op = Sequelize.Op;
const FactoryModel = require('./models/factory')
const NodeModel = require('./models/node')
const RootModel = require('./models/root')

let sequelize = null
if (process.env.CLEARDB_DATABASE_URL) {
  // Prod DB config
  sequelize = new Sequelize(process.env.CLEARDB_DATABASE_URL, {
    dialect:  'mysql',
    logging:  true //false
  })
} else {
  // Local DB config
  sequelize = new Sequelize('tree_view', 'root', 'password', {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  })
}

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

sequelize.sync()
  .then(() => {
  console.log(`Database synced!`)

  // This is a bit hacky, because we don't allow for Root creation we always know we need our one root
  // Ensure its is created immediately if it doesn't exist
  Root.findOrCreate({
    where: {id: 1},
  })
})

module.exports = {
  Root,
  Factory,
  Node,
  Op,
}