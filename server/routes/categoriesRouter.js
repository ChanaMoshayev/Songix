const express = require('express');
const categoriesController = require('../controllers/categoriesController');

const CategoriesRouter = express.Router();

CategoriesRouter.get('/',categoriesController.getAllCategories);
CategoriesRouter.get('/:id',categoriesController.getCategoryById);
CategoriesRouter.post('/',categoriesController.addNewCategory);
CategoriesRouter.put('/:id',categoriesController.updateCategory);
CategoriesRouter.delete('/:id',categoriesController.deleteCategory);

module.exports = CategoriesRouter;