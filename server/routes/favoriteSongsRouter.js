const express = require("express");
const favoritesSongsController = require("../controllers/favoriteSongsController");

const favoritesSongsRouter = express.Router();

favoritesSongsRouter.get("/status", favoritesSongsController.getFavoriteStatus);
favoritesSongsRouter.post("/toggle", favoritesSongsController.toggleFavorite);
favoritesSongsRouter.get("/user/:userId", favoritesSongsController.getFavoritesByUser);
favoritesSongsRouter.get("/", favoritesSongsController.getAllFavoritesSongs);
favoritesSongsRouter.get("/:id", favoritesSongsController.getFavoriteSongById);
favoritesSongsRouter.post("/", favoritesSongsController.addNewFavoriteSong);
favoritesSongsRouter.delete("/:id", favoritesSongsController.deleteFavoriteSong);

module.exports = favoritesSongsRouter;
