//mongoose לייבא את ספרית
const mongoose = require('mongoose');

//יצירת הסכמה
const categorySchema = new mongoose.Schema({
    //id נוסף אוטומטית 
    categoryName: {
        type: String,   //סוג העמודה
        required: true,  //חובה
        trim: true,  //מוחק רווחים מיותרים
        unique: true  //שלא יהיו שתי קטגוריות עם אותו שם
    }
})

//למסד הנתונים הגדרת המודל עצמו
const categoryModel  = mongoose.model('Categories', categorySchema);
//ייצוא של המודל
module.exports = categoryModel;