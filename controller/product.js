const { PrimaryProduct, SecondaryProduct } = require("../models/product");
const { PrimaryPurchase, SecondaryPurchase } = require("../models/purchase");
const { PrimarySales, SecondarySales } = require("../models/sales");
const { SecondaryBrand } = require("../models/brand");
const { ROLES, HISTORY_TYPE, METHODS } = require("../utils/constant");
const { generatePDFfromHTML } = require("../utils/pdfDownload");
const { invoiceBill } = require("../utils/templates/invoice-bill");
const { addHistoryData } = require("./history");
const { ObjectId } = require('mongodb');

const { v4: uuidv4 } = require('uuid');
const { PrimaryAvailableStock, SecondaryAvailableStock } = require("../models/availableStock");
const moment = require("moment");

// Add Post
const addProduct = async (req, res) => {
  try {
    const products = req.body;

    const productDocs = await Promise.all(
      products.map(async (product) => {
        const brand = await SecondaryBrand.findOne({ _id: product.brandId }).lean();
        const productCode = `${(product.name?.toUpperCase() || '').substring(0, 3)}-${(brand.name?.toUpperCase() || '').substring(0, 3)}-${uuidv4().split('-')[0]}`;

        const addProduct = new SecondaryProduct({
          userID: product.userId,
          name: product.name,
          BrandID: product.brandId,
          stock: 0,
          description: product.description,
          productCode,
          manufacturer: product.manufacturer
        });

        let savedProduct = await addProduct.save();

        const requestby = req?.headers?.requestby ? new ObjectId(req.headers.requestby) : ""

        const historyPayload = {
          productID: savedProduct._id,
          description: `${savedProduct?.name || ""} product added`,
          type: HISTORY_TYPE.ADD,
          productCode,
          createdById: requestby,
          updatedById: requestby,
          historyDate: moment().valueOf()
        };

        const { primaryResult, secondaryResult } = await addHistoryData(historyPayload, req?.headers?.role, null, METHODS.ADD);

        savedProduct = { ...savedProduct._doc, HistoryID: secondaryResult?.[0]?._id }
        await Promise.all([
          PrimaryProduct.insertMany([savedProduct]),
          SecondaryProduct.updateOne({ _id: new ObjectId(savedProduct._id) }, { HistoryID: secondaryResult?.[0]?._id })
        ]);

        return savedProduct;
      })
    );

    res.status(200).send(productDocs);
  } catch (err) {
    res.status(402).send(err);
  }
};


// // Get All Products
// const getAllProducts = async (req, res) => {
//   let findAllProducts;
//   if (req?.headers?.role === ROLES.HIDE_MASTER_SUPER_ADMIN)
//     findAllProducts = await PrimaryProduct.find().sort({ _id: -1 });
//   else
//     findAllProducts = await SecondaryProduct.find().sort({ _id: -1 }); // -1 for descending;
//   res.json(findAllProducts);
// };

// Get All Purchase Data
const getAllProducts = async (req, res) => {

  let findAllProducts;
  const aggregationPiepline = [
    {
      $lookup: {
        from: 'brands',
        localField: 'BrandID',
        foreignField: '_id',
        as: 'BrandID'
      }
    },
    {
      $unwind: {
        path: "$BrandID",
        preserveNullAndEmptyArrays: true // Preserve records without matching BrandID
      }
    },
    // {
    //   $lookup: {
    //     from: 'availablestocks',
    //     localField: '_id',
    //     foreignField: 'productID',
    //     as: 'availablestocks'
    //   }
    // },
    // {
    //   $unwind: {
    //     path: "$availablestocks",
    //     preserveNullAndEmptyArrays: true // Preserve records without matching BrandID
    //   }
    // },
    {
      $match: {
        $or: [
          { BrandID: { $exists: true } }, // Include records with valid BrandID
          { BrandID: undefined } // Include records where BrandID is undefined
        ]
      }
    },
    {
      $project: {
        userID: 1,
        name: 1,
        manufacturer: 1,
        stock: 1,
        description: 1,
        productCode: 1,
        BrandID: 1,
        // availablestocks: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1
      },
    },
    { $sort: { _id: -1 } }];
  if (req?.headers?.role === ROLES.HIDE_MASTER_SUPER_ADMIN)
    findAllProducts = await PrimaryProduct.aggregate(aggregationPiepline);
  else
    findAllProducts = await SecondaryProduct.aggregate(aggregationPiepline); // -1 for descending;
  res.json(findAllProducts);
};

// Delete Selected Product
const deleteSelectedProduct = async (req, res) => {
  const product = await SecondaryProduct.findOne({ _id: req.params.id }).lean();
  const deleteProduct = await SecondaryProduct.deleteOne(
    { _id: req.params.id }
  ).then(async (result) => {
    const historyPayload = {
      productID: req.params.id,
      description: `${product?.name || ""} product deleted`,
      type: HISTORY_TYPE.DELETE
    }
    addHistoryData(historyPayload, req?.headers?.role, HISTORY_TYPE.DELETE).catch(err => console.log('Err', err))
    await PrimaryProduct.findByIdAndUpdate(req.params.id, { isActive: false }).catch(() => {
      console.log('Primary product error')
    })
  });

  const deletePurchaseProduct = await SecondaryPurchase.deleteOne(
    { ProductID: req.params.id }
  ).then(async () => {
    await PrimaryPurchase.findByIdAndUpdate({ ProductID: req.params.id }, { isActive: false }).catch(() => {
      console.log('Primary purchase error')
    })
  });

  const deleteSaleProduct = await SecondarySales.deleteOne(
    { ProductID: req.params.id }
  ).then(async () => {
    await PrimarySales.findByIdAndUpdate({ ProductID: req.params.id }, { isActive: false }).catch(() => {
      console.log('Primary sales error')
    })
  });

  const deleteAvailableStock = await SecondaryAvailableStock.deleteMany(
    { productID: req.params.id }
  ).then(async () => {
    await PrimaryAvailableStock.findByIdAndUpdate({ productID: req.params.id }, { isActive: false }).catch(() => {
      console.log('Primary sales error')
    })
  });

  res.json({
    deleteProduct,
    deletePurchaseProduct, deleteSaleProduct, deleteAvailableStock
  });
};

// Update Selected Product
const updateSelectedProduct = async (req, res) => {
  try {
    // const productCode = `${req.body.name?.toUpperCase()}-${uuidv4().split('-')[0]}`
    const updatedResult = await SecondaryProduct.findByIdAndUpdate(
      { _id: req.body.productID },
      {
        name: req.body.name,
        manufacturer: req.body.manufacturer,
        description: req.body.description,
        BrandID: req.body.brandId
        // productCode,
      },
      { new: true }
    );

    const requestby = req?.headers?.requestby ? new ObjectId(req.headers.requestby) : ""

    const historyPayload = {
      productID: updatedResult._id,
      description: `${updatedResult?.name || ""} product added`,// updated`,
      type: HISTORY_TYPE.UPDATE,
      // productCode,
      createdById: requestby,
      updatedById: requestby,
      historyID: updatedResult?.HistoryID || ""
    }


    await addHistoryData(historyPayload, req?.headers?.role, null, METHODS.UPDATE).catch(err => console.log('Err', err))

    await PrimaryProduct.findByIdAndUpdate({ _id: req.body.productID }, {
      name: req.body.name,
      manufacturer: req.body.manufacturer,
      description: req.body.description,
    })
    res.json(updatedResult);
  } catch (error) {
    res.status(402).send("Error");
  }
};

// Search Products
const searchProduct = async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm; PrimaryAvailableStock
    const selectWarehouse = req.query.selectWarehouse;
    const filter = {
      $or: [
        { name: { $regex: searchTerm, $options: "i" } },
        { productCode: { $regex: searchTerm, $options: "i" } }
      ]
    }

    if (selectWarehouse) {
      filter.warehouseID = new ObjectId(selectWarehouse);
      filter["$or"] = [
        { "productID.name": { $regex: searchTerm, $options: "i" } },
        { "productID.productCode": { $regex: searchTerm, $options: "i" } }
      ]
    }

    let primaryModel = PrimaryProduct;
    let secondaryModel = SecondaryProduct;

    if (selectWarehouse) {
      primaryModel = PrimaryAvailableStock;
      secondaryModel = SecondaryAvailableStock;
    }

    let findAllProducts;
    const pipeline = [
      {
        $lookup: {
          from: 'brands',
          localField: 'BrandID',
          foreignField: '_id',
          as: 'BrandID'
        }
      },
      {
        $unwind: {
          path: "$BrandID",
          preserveNullAndEmptyArrays: true // Preserve records without matching BrandID
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'productID',
          foreignField: '_id',
          as: 'productID'
        }
      },
      {
        $unwind: {
          path: "$productID",
          preserveNullAndEmptyArrays: true // Preserve records without matching BrandID
        }
      },
      {
        $lookup: {
          from: 'brands',
          localField: 'productID.BrandID',
          foreignField: '_id',
          as: 'productID.BrandID'
        }
      },
      {
        $unwind: {
          path: "$productID.BrandID",
          preserveNullAndEmptyArrays: true // Preserve records without matching BrandID
        }
      },
      {
        $match: filter
      },
      {
        $sort: { _id: -1 }
      }
    ];
    if (req?.headers?.role === ROLES.HIDE_MASTER_SUPER_ADMIN)
      findAllProducts = await primaryModel
        .aggregate(pipeline);
    else
      findAllProducts = await secondaryModel
        .aggregate(pipeline); // -1 for descending;
    res.json(findAllProducts);
  } catch (error) {
    res.status(500).send({ error, message: error?.message || "" });
  }
};

// Search Products
const searchProductByWarehouse = async (req, res) => {
  try {
    const searchTerm = req.query.selectWarehouse;

    let findAllProducts;
    if (req?.headers?.role === ROLES.HIDE_MASTER_SUPER_ADMIN)
      findAllProducts = await PrimaryAvailableStock
        .aggregate([
          {
            $lookup: {
              from: 'product',
              localField: 'productID',
              foreignField: '_id',
              as: 'productID'
            }
          },
          {
            $unwind: {
              path: "$productID",
              preserveNullAndEmptyArrays: true // Preserve records without matching BrandID
            }
          },
          {
            $match: {
              warehouseID: new ObjectId(searchTerm)
            }
          },
        ])

    else
      findAllProducts = await SecondaryAvailableStock
        .aggregate([
          {
            $match: {
              warehouseID: new ObjectId(searchTerm)
            }
          },
          {
            $lookup: {
              from: 'products',
              localField: 'productID',
              foreignField: '_id',
              as: 'productID'
            }
          },
          {
            $unwind: {
              path: "$productID",
              preserveNullAndEmptyArrays: true // Preserve records without matching BrandID
            }
          },
          {
            $lookup: {
              from: 'brands',
              localField: 'productID.BrandID',
              foreignField: '_id',
              as: 'productID.BrandID'
            }
          },
          {
            $unwind: {
              path: "$productID.BrandID",
              preserveNullAndEmptyArrays: true // Preserve records without matching BrandID
            }
          },

        ])
    res.json(findAllProducts);
  } catch (error) {
    res.status(500).send({ error, message: error?.message || "" });
  }
};

// Get Total product count
const getTotalCounts = async (req, res) => {
  try {
    let totalProductCounts = 0
    let totalItemInWarehouse = 0
    const filter = {}

    const selectWarehouse = req.query.selectWarehouse;

    if (selectWarehouse) {
      filter.warehouseID = new ObjectId(selectWarehouse);
      primaryModel = PrimaryAvailableStock
      secondaryModel = SecondaryAvailableStock
    }

    if (req?.headers?.role === ROLES.HIDE_MASTER_SUPER_ADMIN) {
      totalProductCounts = await PrimaryProduct.find().count()
      totalItemInWarehouse = await PrimaryAvailableStock.find(filter).count()
    }
    else {
      totalProductCounts = await SecondaryProduct.find().count()
      totalItemInWarehouse = await SecondaryAvailableStock.find(filter).count()
    }

    res.json({ totalProductCounts, totalItemInWarehouse });
  } catch (error) {
    res.status(500).send({ error, message: error?.message || "" });
  }
}

module.exports = {
  addProduct,
  getAllProducts,
  deleteSelectedProduct,
  updateSelectedProduct,
  searchProduct,
  searchProductByWarehouse,
  getTotalCounts
};
