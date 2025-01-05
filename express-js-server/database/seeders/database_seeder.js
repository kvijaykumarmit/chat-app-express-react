require('../../mongodb_connection.js')()
const userModel = require ('../../models/user.model');
const bcrypt = require('bcrypt');


async function seeder(){
    const salt = await bcrypt.genSalt(10);   
    const hashedPassword =await bcrypt.hash("password", salt); 
    await userModel.insertMany([
        {
            first_name: "Vijay",
            last_name: "Kumar",
            display_name: "Vijaykumar",
            mobile: "+91 9876543210",
            email: "vijaykumar@chatmail.com",
            gender: "Male",
            password: hashedPassword
        },
        {
            first_name: "Karthi",
            last_name: null,
            display_name: "Karthi",
            mobile: "+91 9876543211",
            email: "karthi@chatmail.com",
            gender: "Male",
            password: hashedPassword
        },
        {
            first_name: "Samy",
            last_name: null,
            display_name: "Samy",
            mobile: "+91 9876543214",
            email: "samy@chatmail.com",
            gender: "Male",
            password: hashedPassword
        },
        {
            first_name: "Keerthana",
            last_name: null,
            display_name: "Keerthana",
            mobile: "+91 9876543212",
            email: "keerthana@chatmail.com",
            gender: "Female",
            password: hashedPassword
        },
        {
            first_name: "Pranita",
            last_name: null,
            display_name: "Pranita",
            mobile: "+91 9876543213",
            email: "pranita@chatmail.com",
            gender: "Female",
            password: hashedPassword
        },
        {
            first_name: "Preethi",
            last_name: null,
            display_name: "Preethi",
            mobile: "+91 9876543215",
            email: "preethi@chatmail.com",
            gender: "Female",
            password: hashedPassword
        },
        {
            first_name: "Karthika",
            last_name: null,
            display_name: "Karthika",
            mobile: "+91 9876543216",
            email: "karthika@chatmail.com",
            gender: "Female",
            password: hashedPassword
        },
        {
            first_name: "Gokul",
            last_name: null,
            display_name: "gokul",
            mobile: "+91 9876543217",
            email: "gokul@chatmail.com",
            gender: "Male",
            password: hashedPassword
        },
        {
            first_name: "Sanjay",
            last_name: null,
            display_name: "sanjay",
            mobile: "+91 9876543218",
            email: "sanjay@chatmail.com",
            gender: "Male",
            password: hashedPassword
        }
    ]);
}

seeder();

module.exports = seeder;

