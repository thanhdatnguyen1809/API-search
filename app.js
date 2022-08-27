require("dotenv").config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 2999;
const router = express.Router();
const mongoose = require("mongoose");
const Product = require("./models/Product");
const notFound = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connect to db successfully"))
  .catch((err) => console.log(err));

router.get("/products", async (req, res, next) => {
  try {
    const { name, featured, company } = req.query;
    let { sort, fields, limit, skip, page, numericFilters } = req.query;
    const queryObject = {};
    if (name) {
      queryObject.name = { $regex: name || "", $options: "i" };
    }
    if (company) {
      queryObject.company = { $regex: company || "", $options: "i" };
    }
    if (featured) {
      queryObject.featured = featured === "true" ? true : false;
    }
    if (sort) {
      sort = sort.replace(",", " ");
    }
    if (fields) {
      fields = fields.replace(",", " ");
    }
    if (numericFilters) {
      // queryObject = { rating: {$gt:5}, price:{$lt30} };
      // Product.find({rating:{$lt:5},price:{$gt:30}})
      const operatorMap = {
        ">": "$gt",
        ">=": "$gte",
        "=": "$eq",
        "<": "$lt",
        "<=": "$lte",
      };

      const regexComparisonOperators = /\b(>|<|>=|=|<=)\b/g;
      const returnNumericFilters = numericFilters
        .replace(regexComparisonOperators, (replaceValue) => {
          replaceValue = "-" + operatorMap[replaceValue] + "-";
          return replaceValue;
        })
        .split(",")
        .map((str) => str.split("-"));
      returnNumericFilters.forEach((i) => {
        const options = ["rating", "price"];
        let [field, operator, value] = i;
        if (options.includes(field)) {
          queryObject[field] = {
            [operator]: Number(value),
          };
        }
      });
    }

    limit = parseInt(limit) || 10;
    skip = parseInt(skip) || 0;
    page = parseInt(page);
    page = (page - 1) * limit;

    const products = await Product.find(queryObject)
      .select(fields)
      .limit(limit)
      .skip(page)
      .sort(sort);
    res.status(200).json({ total: products.length, products });
  } catch (err) {
    next('error for something');
  }
});

app.use("/api/v1", router);

app.use(errorHandlerMiddleware);
app.use('/', notFound);

app.listen(PORT, () => {
  console.log(`Server is running on PORT ${PORT}`);
});
