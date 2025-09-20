# HSN Code Integration Implementation

## Overview

This document describes the complete HSN (Harmonized System of Nomenclature) code integration implemented in the Shiv Accounts Cloud system. The implementation follows the specifications provided in the HSN API documentation and includes all features required for GST compliance in India.

## Implementation Components

### 1. HSN API Endpoint (`/api/hsn/search`)

**Location**: `src/app/api/hsn/search/route.ts`

**Purpose**: Integrates with the government HSN API to search and retrieve HSN codes and descriptions.

**Features**:
- Search by HSN code (numeric input)
- Search by product/service description (text input)
- Automatic category detection (Products vs Services)
- Error handling with meaningful messages
- Request timeout protection (10 seconds)
- Proper authentication validation

**API Parameters**:
- `inputText`: The search term (HSN code or description)
- `selectedType`: 'byCode' or 'byDesc'
- `category`: null (for code search), 'P' (products), 'S' (services)

**Example Usage**:
```javascript
// Search by HSN code
GET /api/hsn/search?inputText=1001&selectedType=byCode&category=null

// Search by product description
GET /api/hsn/search?inputText=steel&selectedType=byDesc&category=P

// Search by service description
GET /api/hsn/search?inputText=consultation&selectedType=byDesc&category=S
```

### 2. HSN Search Component (`HSNSearch`)

**Location**: `src/components/ui/hsn-search.tsx`

**Purpose**: A React component that provides an intuitive interface for searching and selecting HSN codes.

**Features**:
- Autocomplete search with real-time API calls
- Debounced search (500ms delay) to reduce API calls
- Support for both numeric (HSN code) and text (description) searches
- Visual feedback for loading and error states
- Automatic product type detection (GOODS vs SERVICE)
- Clear and select functionality
- Dropdown with formatted results
- Keyboard navigation support

**Props**:
- `value`: Current HSN code value
- `onSelect`: Callback when HSN code is selected
- `onClear`: Callback when selection is cleared
- `productType`: 'GOODS' or 'SERVICE' (auto-sets search category)
- `placeholder`: Custom placeholder text
- `disabled`: Disable the component
- `required`: Mark as required field
- `label`: Custom label text

**Example Usage**:
```jsx
<HSNSearch
    value={formData.hsnCode}
    onSelect={(hsnCode) => handleChange('hsnCode', hsnCode)}
    onClear={() => handleChange('hsnCode', '')}
    productType={formData.type as 'GOODS' | 'SERVICE'}
    placeholder="Search HSN code or description..."
    required
/>
```

### 3. HSN Validation Utilities (`hsn-validation.ts`)

**Location**: `src/lib/hsn-validation.ts`

**Purpose**: Provides validation and utility functions for HSN codes.

**Functions**:

#### `validateHSNCode(hsnCode: string): HSNValidationResult`
- Validates HSN code format and structure
- Ensures codes are 2, 4, 6, or 8 digits long
- Validates chapter codes (01-99)
- Returns validation result with error messages

#### `suggestTaxRate(hsnCode: string): number | null`
- Suggests appropriate tax rates based on HSN code
- Includes mapping for common product categories
- Returns 5%, 12%, or 18% based on product type
- Defaults to 18% for unmapped codes

#### `formatHSNCode(hsnCode: string): string`
- Formats HSN codes for better readability
- Adds spacing between digit groups
- Example: "84143000" → "84 14 30 00"

**Example Usage**:
```javascript
import { validateHSNCode, suggestTaxRate, formatHSNCode } from '@/lib/hsn-validation';

const result = validateHSNCode("8414");
if (result.isValid) {
    const taxRate = suggestTaxRate("8414"); // Returns 18
    const formatted = formatHSNCode("8414"); // Returns "84 14"
}
```

### 4. Updated Product Forms

**Files Updated**:
- `src/app/(dashboard)/dashboard/products/new/page.tsx`
- `src/app/(dashboard)/dashboard/products/[id]/edit/page.tsx`

**Changes**:
- Replaced simple HSN code input with `HSNSearch` component
- Added automatic product type detection
- Integrated HSN selection with form state management

## Integration Flow

### 1. User Interaction Flow

1. **Product Creation/Edit**: User navigates to product form
2. **HSN Search**: User clicks on HSN field, opens search interface
3. **Search Input**: User types HSN code or product description
4. **API Call**: Component makes debounced API call to `/api/hsn/search`
5. **Government API**: Internal API calls government HSN service
6. **Results Display**: Formatted results shown in dropdown
7. **Selection**: User selects appropriate HSN code
8. **Validation**: HSN code is validated using utility functions
9. **Form Update**: Selected HSN code updates product form
10. **Save**: Product is saved with proper HSN code

### 2. API Integration Flow

```
Frontend (HSNSearch) 
    ↓ (debounced search)
Local API (/api/hsn/search)
    ↓ (with headers & timeout)
Government HSN API (services.gst.gov.in)
    ↓ (structured response)
Local API (formats response)
    ↓ (formatted data)
Frontend (displays results)
```

### 3. Error Handling

The implementation includes comprehensive error handling:

- **Network Errors**: Handles connectivity issues
- **API Timeouts**: 10-second timeout protection
- **Invalid Responses**: Validates API response structure
- **Authentication**: Requires valid user session
- **Validation Errors**: Client-side HSN format validation
- **Rate Limiting**: Debounced requests to prevent API abuse

## Configuration

### Environment Variables

No additional environment variables are required. The implementation uses the public government HSN API endpoint.

### API Headers

The implementation includes appropriate headers for the government API:
- `Accept: application/json`
- `User-Agent: ShivAccountsCloud/1.0`

## Security Considerations

1. **Authentication**: All HSN API calls require valid user authentication
2. **Rate Limiting**: Debounced searches prevent API abuse
3. **Input Validation**: All inputs are validated before API calls
4. **Error Masking**: Detailed error messages are logged but not exposed to users
5. **Timeout Protection**: Prevents hanging requests

## Testing

### Manual Testing

1. **Navigate to Products**: Go to Dashboard → Products → Add New Product
2. **HSN Search**: Click on the HSN Code field
3. **Search by Code**: Enter a numeric HSN code (e.g., "1001")
4. **Search by Description**: Enter a product description (e.g., "steel")
5. **Select HSN**: Choose from the dropdown results
6. **Verify Selection**: Confirm HSN code is populated in the form

### API Testing

Use the test endpoint to verify HSN API functionality:
```bash
curl "http://localhost:3008/api/hsn/test"
```

### Component Testing

The HSN search component can be tested independently in different scenarios:
- With and without internet connectivity
- With valid and invalid HSN codes
- With different product types (GOODS vs SERVICE)
- With various search terms and descriptions

## Compliance Features

### GST Compliance

1. **Standard HSN Codes**: Uses official government HSN database
2. **Tax Rate Mapping**: Suggests appropriate tax rates based on HSN
3. **Product Classification**: Distinguishes between goods and services
4. **Audit Trail**: All HSN selections are logged and stored

### Indian Accounting Standards

1. **Proper Classification**: Products are classified according to HSN standards
2. **Tax Calculation**: Automatic tax rate suggestions for accurate GST computation
3. **Reporting**: HSN codes are included in all transaction reports
4. **Compliance Validation**: HSN codes are validated for format and authenticity

## Future Enhancements

### Planned Improvements

1. **Offline HSN Database**: Local HSN database for faster searches
2. **HSN History**: Recent HSN searches and selections
3. **Bulk HSN Update**: Mass HSN code assignment for existing products
4. **Advanced Validation**: Integration with GSTN API for real-time validation
5. **Auto-suggestions**: Machine learning-based HSN suggestions
6. **Multi-language Support**: HSN descriptions in multiple Indian languages

### Performance Optimizations

1. **Caching**: Redis cache for frequently searched HSN codes
2. **Pagination**: Large result sets with pagination
3. **Background Sync**: Periodic HSN database updates
4. **CDN Integration**: Faster API responses through CDN

## Troubleshooting

### Common Issues

1. **No Search Results**: Check internet connectivity and API endpoint availability
2. **Slow Searches**: Verify debounce timing and API response times
3. **Authentication Errors**: Ensure user is properly logged in
4. **Validation Errors**: Check HSN code format (2, 4, 6, or 8 digits)

### Debug Information

Enable debug logging by checking the browser console for:
- API request URLs and parameters
- Response data and error messages
- Component state changes
- Validation results

## Support

For technical support or questions about the HSN implementation:

1. Check the console logs for detailed error messages
2. Verify government API availability
3. Test with known valid HSN codes (e.g., 1001, 8414)
4. Ensure proper authentication and session management

This implementation provides a robust, user-friendly, and GST-compliant HSN code integration that meets all requirements specified in the original documentation.