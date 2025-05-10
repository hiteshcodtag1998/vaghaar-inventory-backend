const express = require("express");
const app = express();
const sales = require("../controller/sales");

// Add Sales
app.post("/add", sales.addSales);

// Get All Sales
app.get("/get", sales.getSalesData);
app.get("/getmonthly", sales.getMonthlySales);


app.get("/get/totalsaleamount", sales.getTotalSalesAmount);

app.post("/sale-pdf-download", sales.salePdfDownload)

// Update Selected sale
app.post("/update", sales.updateSelectedSale);

// Delete Selected Sale Item
app.delete("/delete/:id", sales.deleteSelectedSale);

app.post("/sale-multipleitems-pdf-download", sales.saleMultileItemsPdfDownload)

module.exports = app;



// http://localhost:4000/api/sales/add POST
// http://localhost:4000/api/sales/get GET
