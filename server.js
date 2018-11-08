var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
const { Root, Factory, Node, Op } = require('./sequelize')

const maxBound = 1000000000

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port);

io.on('connection', function (socket) {
  socket.on('addFactory', (data) => addFactory(data, socket))
  socket.on('editFactory', (data) => editFactory(data, socket))
  socket.on('deleteFactory', deleteFactory)
  socket.on('regenFactoryNodes', regenFactoryNodes)
  emitTree(socket)
});

function retrieveTree() {
  return Root.find({
    where: {id: 1},
    include: [
      {
        model: Factory,
        include: [Node]
      }
    ],
    order: [
      [ Factory, 'id', 'ASC'],
      [ Factory, Node, 'id', 'ASC']
    ]
  })
}

// Emits tree to a specific connection
function emitTree(socket) {
  retrieveTree().then((res) => {
    socket.emit('tree', { root: res});
});
}

// Emits tree to all open connections
function emitTreeToAll() {
  retrieveTree().then((res) => {
    io.emit('tree', { root: res});
  });
}

function emitError(socket, error) {
  socket.emit('validationError', error)
}

function regenNodes(factory, numNodes) {
  return Node.destroy({where: {factoryId: factory.id}}).then((numDeleted) => {
    if(!numNodes) {
      numNodes = numDeleted
    }
    var newNodes = []
    for(var i = 0; i < numNodes; i++) {
      newNodes.push({factoryId: factory.id, number: getRandomInt(factory.lowerBound, factory.upperBound)})
    }
    return Node.bulkCreate(newNodes)
  })
}

function validationError(data) {
  // Ensure there is a name
  if(!data.name.trim()) {
    return 'There is a problem with the factory name'
  }

  // Ensure bounds are within our defined tolerance
  if((data.lowerBound < (-1 * maxBound)) || (data.upperBound > maxBound)) {
    return 'Children bounds are... out of bounds!  Please ensure they are within ' + (-1*maxBound).toString() + ' to ' + maxBound.toString()
  }

  // Ensure upperBound > lowerBound
  if(data.upperBound < data.lowerBound) {
    return 'Children upper bound must be greater than or equal to lower bound'
  }

  return ''
}

function addFactory(data, socket) {
  let error = validationError(data)
  if (error) {
    emitError(socket, error)
    return
  }

  let nodes = []
  const lowerBound = data.lowerBound
  const upperBound = data.upperBound
  for(var i = 0; i < data.numChildren; i++) {
    nodes.push({number: getRandomInt(lowerBound, upperBound)})
  }

  Factory.create({
    name: data.name,
    lowerBound: lowerBound,
    upperBound: upperBound,
    nodes: nodes,
    rootId: 1,
  }, {include: [ Node ]})
    .then(() => {
    emitTreeToAll()
  })
}

function editFactory(data, socket) {
  let error = validationError(data)
  if (error) {
    emitError(socket, error)
    return
  }

  Factory.findById(data.id).then((factory) => {
    if(factory) {
      factory.name = data.name
      factory.lowerBound = data.lowerBound
      factory.upperBound = data.upperBound

      // If we now have nodes outside of the existing bounds, regen all nodes
      factory.save().then((factory) => {
        Node.findAll({
          where: {
            factoryId: factory.id,
            number: {
              [Op.or]: {
                [Op.lt]: factory.lowerBound,
                [Op.gt]: factory.upperBound
              }
            }
          },
        }).then((nodes) => {
          if(nodes.length > 1) {
            regenNodes(factory, null).then(() => emitTreeToAll())
          }
        })
      })
    }
  })
}

function deleteFactory(data) {
  Factory.findById(data.id).then((factory) => {
    factory.destroy().then(() => emitTreeToAll())
  })
}

function regenFactoryNodes(data) {
  if(data.numChildren < 1 || data.numChildren > 15) {
    return
  }

  Factory.findById(data.id).then((factory) => {
    Node.destroy({where: {factoryId: factory.id}}).then(() => {
      regenNodes(factory, data.numChildren).then(() => emitTreeToAll())
    })
  })
}

// Get a random integer between min and max where min and max are inclusive
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// For testing if the server is running
app.get('/', function (req, res) {
  res.send({ response: "Server is running" }).status(200);
});