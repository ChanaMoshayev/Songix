const mongoose = require('mongoose');
const bcrypt = require("bcrypt");

const usersSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true, //הערך חייב להיות ייחודי במסד הנתונים
        trim: true //מוריד רווחים מיותרים מההתחלה ומהסוף של מחרוזת
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },

    password: {
    type: String,
    required: true,
    validate: {
        validator: function(value) {
            return value.length >= 6; // הסיסמה חייבת להכיל לפחות 6 תווים
        },
        message: 'הסיסמה חייבת להכיל לפחות 6 תווים'
    }
},

    profileImage: {
        type: String
    },

    status: { //איזה סוג משתמש
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    isEmailVerified: {
        type: Boolean,
        default: false
    }
})

usersSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    // אם כבר מוצפן ב-bcrypt (מתחיל ב-$2) לא להצפין שוב
    if (typeof this.password === "string" && this.password.startsWith("$2")) return;
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
});

usersSchema.methods.verifyPassword = async function (plainPassword) {
    // תמיכה גם בסיסמאות ישנות שנשמרו כטקסט (לפני שהוספנו hashing)
    if (typeof this.password === "string" && this.password.startsWith("$2")) {
        return await bcrypt.compare(plainPassword, this.password);
    }
    return this.password === plainPassword;
};

const usersModel = mongoose.model("Users", usersSchema);
module.exports = usersModel;

