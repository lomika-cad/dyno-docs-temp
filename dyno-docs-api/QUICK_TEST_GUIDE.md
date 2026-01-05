# Quick Test Guide - Places Excel Upload

## Prerequisites
1. Stop running application (if any)
2. Apply database migration:
   ```bash
   cd D:\sgdp-dyno-docs\dyno-docs-temp\dyno-docs-api\Infrastructure
   dotnet ef database update --startup-project ..\UI\UI.csproj
   ```
3. Start application

## Test Endpoint

### API Details
- **URL**: `POST /api/operations/places/upload-excel`
- **Content-Type**: `multipart/form-data`
- **Parameter**: `file` (IFormFile)
- **Template**: `UI/Templates/places.xlsx`

### Using Postman
1. Create new POST request
2. URL: `http://localhost:5000/api/operations/places/upload-excel` (adjust port)
3. Go to Body tab
4. Select `form-data`
5. Add key: `file`, Type: `File`
6. Choose Excel file
7. Send

### Using cURL
```bash
curl -X POST "http://localhost:5000/api/operations/places/upload-excel" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/places.xlsx"
```

### Using PowerShell
```powershell
$uri = "http://localhost:5000/api/operations/places/upload-excel"
$filePath = "D:\sgdp-dyno-docs\dyno-docs-temp\dyno-docs-api\UI\Templates\places.xlsx"
$form = @{
    file = Get-Item -Path $filePath
}
Invoke-RestMethod -Uri $uri -Method Post -Form $form
```

## Excel Format

### Column Structure (in order)
| Column | Field Name              | Required | Type   |
|--------|-------------------------|----------|--------|
| A      | District                | Yes      | Text   |
| B      | City                    | Yes      | Text   |
| C      | Name                    | Yes      | Text   |
| D      | Average Visit Duration  | Yes      | Text   |
| E      | Description             | No       | Text   |
| F      | Fun Fact                | No       | Text   |
| G      | Images                  | No       | Images |

### Sample Data
```
Row 1 (Header): District | City | Name | Average Visit Duration | Description | Fun Fact | Images
Row 2: Western | Colombo | Galle Face Green | 2 hours | Beautiful beach... | Built in 1859 | [Embedded Images]
Row 3: Central | Kandy | Temple of Tooth | 1.5 hours | Sacred Buddhist... | UNESCO site | [Embedded Images]
```

## Expected Responses

### ✅ Success
```json
{
  "succeeded": true,
  "isPending": false,
  "dateTime": "2026-01-05T...",
  "message": "Processed 10 rows. Success: 10, Skipped: 0",
  "errors": [],
  "data": {
    "successCount": 10,
    "skippedCount": 0
  }
}
```

### ⚠️ Partial Success
```json
{
  "succeeded": true,
  "message": "Processed 10 rows. Success: 8, Skipped: 2",
  "data": {
    "successCount": 8,
    "skippedCount": 2,
    "errors": [
      "Row 5: Invalid data or missing required fields",
      "Row 9: Invalid data or missing required fields"
    ]
  }
}
```

### ❌ Validation Error
```json
{
  "succeeded": false,
  "message": "Invalid file format. Only .xlsx files are supported",
  "errors": ["Invalid file format. Only .xlsx files are supported"]
}
```

### ❌ Empty File
```json
{
  "succeeded": false,
  "message": "Excel file is empty",
  "errors": ["Excel file is empty"]
}
```

## Verify Results

### Check Database
```sql
SELECT 
    Name, 
    District, 
    City, 
    AverageVisitDuration,
    Description,
    FunFact,
    CASE WHEN Image1 IS NOT NULL THEN 'Yes' ELSE 'No' END AS HasImage1,
    CASE WHEN Image2 IS NOT NULL THEN 'Yes' ELSE 'No' END AS HasImage2,
    CreatedAt
FROM Places
ORDER BY CreatedAt DESC;
```

### Test GET Endpoint
```bash
GET /api/operations/places
```
Should return places with base64 encoded images in `image1Url`, `image2Url`, etc.

## Troubleshooting

### Issue: "File is locked"
- **Solution**: Stop the running application before rebuilding

### Issue: "Invalid file format"
- **Solution**: Ensure file has .xlsx extension (not .xls)

### Issue: "Column not found" errors
- **Solution**: Verify Excel columns are in correct order (A-G)

### Issue: No images imported
- **Solution**: 
  - Ensure images are embedded in Excel (not just placed in cells)
  - Images should be anchored to data rows (not header row)
  - Check image file formats (JPG, PNG supported)

### Issue: All rows skipped
- **Solution**: 
  - Check first row is header (will be skipped)
  - Verify required fields are not empty: District, City, Name, Average Visit Duration

## Additional Endpoints

### Get All Places
```
GET /api/operations/places
```

### Get Place by ID
```
GET /api/operations/places/{id}
```

### Create Place
```
POST /api/operations/places
Content-Type: application/json

{
  "name": "Test Place",
  "averageVisitDuration": "2 hours",
  "district": "Western",
  "city": "Colombo",
  "description": "Test description",
  "funFact": "Test fact",
  "image1": "base64string...",
  "image2": "base64string..."
}
```

### Update Place
```
PUT /api/operations/places/{id}
```

### Delete Place
```
DELETE /api/operations/places/{id}
```

