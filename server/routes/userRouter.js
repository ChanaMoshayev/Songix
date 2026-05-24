const express = require('express');
const usersController = require('../controllers/usersConrtoller')
const usersRauter = express.Router(); //exports

usersRauter.get('/', usersController.getAllUsers);
usersRauter.post('/', usersController.addNewUser);
usersRauter.get('/:id', usersController.getUserById);
usersRauter.delete('/:id', usersController.deleteUser);
usersRauter.put('/:id', usersController.updateUser);

module.exports = usersRauter;
 