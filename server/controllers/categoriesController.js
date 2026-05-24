//לייבא את המודל לעמוד שלי
const Category = require('../models/categoriesModel');
const { resolveErrorMessage } = require("../utils/mongoErrors");

const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json(categories);
    } catch (err) {
        console.error("[categories] getAllCategories error:", err?.message || err);
        res.status(500).json({ message: resolveErrorMessage(err, "שגיאה בטעינת קטגוריות.") });
    }
}

const getCategoryById = async (req, res) => {
    try {
        // const user = await User.find({ _id: req.params.id });
        const category = await Category.findById(req.params.id);
        res.status(200).send(category);
    } catch (err) {
        res.status(500).send(err);
    }
}

const addNewCategory = async (req, res) => {
    try {
        //יצירת אובייקט מהסכמה שיש לנו של יוזר
        const newCategory = new Category({ ...req.body });
        //ניגש לשמור את היוזר החדש במסד הנתונים
        await newCategory.save();
        //מחזיר את היוזר החדש
        res.status(200).send({ message: "category added to DB", category: newCategory })
    }
    catch (err) {
        //אם נתקל בבעיה מחזיר את זה
        res.status(500).send(err);
    }
}

//עדכון משתמש 
const updateCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id , {$set:{...req.body}} , {new:true})
        res.status(200).send({ message: "category updated", updateCategory: category  })
    } catch (err) {
        res.status(500).send(err);
    }
}

const deleteCategory = async(req,res)=>{
    try{
        const category = await Category.findByIdAndDelete(req.params.id);
        res.status(200).send({ message: "category delete", deleteCategory: category  })

    } catch (err) {
        res.status(500).send(err);
    }
}

module.exports = {
    getAllCategories,
    getCategoryById,
    addNewCategory,
    updateCategory,
    deleteCategory
}