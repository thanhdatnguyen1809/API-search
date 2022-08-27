const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {type: String, required: true},
    price: Number,
    featured: Boolean,
    company: String,
    rating: Number
});

module.exports = mongoose.model('Product', productSchema);