const User  = require('../models/usersModel');
// const { post } = require('../../router/studentRouter');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
        res.status(200).send(users);
    }
    catch (err) {
        res.status(500).send("some error" + err);
    }
}

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) {
      return res.status(404).send({ message: "משתמש לא נמצא" });
    }
    return res.status(200).send(user);
  } catch (err) {
    return res.status(500).send(err);
  }
};

const addNewUser = async (req, res) => {
    try {
        const newUser = new User({ ...req.body });
        await newUser.save();
        res.status(200).send({ masssae: "user added to DB", user: newUser });
    }
    catch (err) {
        res.status(404).send(err);
    }
}

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        res.status(200).send(user);
    }
    catch (err) {
        res.status(400).send(err);
    }
}

const updateUser = async (req, res) => {
    try {
        const result = await User.findByIdAndUpdate(req.params.id, {
            $set: { ...req.body }
        }, { new: true });
        res.status(200).send(result);
    }
    catch (err) {
        res.status(400).send(err);
    }
}


module.exports = {
    getAllUsers,
    getUserById,
    addNewUser,
    deleteUser,
    updateUser
}