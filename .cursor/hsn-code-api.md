Here is a comprehensive markdown file describing HSN functionality for Problem Statement 2, referencing both the hackathon requirements and API Endpoint for HSN code.[1][2]

***

# HSN Functionality Documentation

## Overview

The HSN (Harmonized System of Nomenclature) code is a standardized system for classifying goods and services under GST and international trade. In the Shiv Accounts Cloud, it's used for automating tax computation, standardized reporting, and efficient product categorization in invoices and stock statements.[1]

## HSN API Endpoint Reference

- **Endpoint:** `https://services.gst.gov.in/commonservices/hsnsearch?q`
- **Method:** `GET`
- **Purpose:** Retrieve HSN codes and descriptions for goods and services, either by code or by description.[2]

### Query Parameters

| Parameter     | Type    | Required | Description                                                                             |
|---------------|---------|----------|-----------------------------------------------------------------------------------------|
| inputText     | string  | Yes      | The search term entered by the user. Can be an HSN code digit or description.           |
| selectedType  | string  | Yes      | Search type: `byCode` (HSN code) or `byDesc` (description).                             |
| category      | string  | Yes      | `null` for code search, `P` for product/goods, `S` for services search by description.  |

#### Example Requests

- **By HSN Code:**  
  `GET https://services.gst.gov.in/commonservices/hsnsearch?qsearch?inputText=1001&selectedType=byCode&category=null`[2]

- **By Description:**  
  `GET https://services.gst.gov.in/commonservices/hsnsearch?qsearch?inputText=steel&selectedType=byDesc&category=P`[2]

#### Example Response

```json
{
  "data": [
    { "c": "1001", "n": "Wheat and meslin" },
    { "c": "100190", "n": "Other wheat" }
  ]
}
```
- `c`: HSN Code
- `n`: Description of the product/service[2]

## Integration Flow in Accounting System

- **Product Master:**  
  - Each product/service is associated with an HSN code for tax and reporting.[1]
- **Invoice Generation:**  
  - Select products/services, system fetches HSN codes using the above API for populating invoice items.
- **Stock Statement and Reports:**  
  - Inventory and transaction reports include HSN codes for compliance and tracking.[1]

## Functional Steps

1. **HSN Search:**
   - User enters either an HSN code or product/service description.
   - System calls the HSN API endpoint with appropriate parameters.
   - Suggestions are presented for user selection.[2]

2. **HSN Assignment:**
   - Upon creating/updating a product, the selected HSN code is stored in the product master for further transactions.[1]

3. **HSN in Transactions:**
   - When recording sales, purchases, or generating invoices, the product’s HSN code is auto-populated for each line item.[1]

## Error Handling

- **Invalid Queries:**
  - If the API returns no results, prompt the user to refine their input or check for spelling/code errors.[2]
- **API Failure:**
  - Log errors and display meaningful messages to users for support and troubleshooting.

## Compliance & Reporting

- **Standardized Tax Calculation:**  
  - Correct HSN mapping ensures GST rates and tax computation are accurate.
- **Automated Reports:**  
  - Enables automated creation of GST-compliant invoices and stock/account statements including HSN information.[1]

***

This markdown file covers all aspects of HSN functionality for the cloud accounting problem statement, including direct references to the provided API details and integration steps.[2][1]

[1](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/83390641/139f7e87-0add-4e11-9925-748965989535/NMIT-Hackathon-Problem-statment.pdf)
[2](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/83390641/403fc148-31ed-4721-8616-fef6e5d7d5c5/API-Endpoint-for-HSN-code-1.pdf)