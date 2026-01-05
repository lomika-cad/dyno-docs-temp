# DynoDocsApi

A multi-tenant .NET 8 Web API built with Clean Architecture principles, FastEndpoints, and Entity Framework Core.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Design Patterns & Practices](#design-patterns--practices)
- [Multi-Tenancy](#multi-tenancy)
- [CRUD Service Pattern](#crud-service-pattern)
- [FastEndpoints](#fastendpoints)
- [How to Extend](#how-to-extend)
- [Getting Started](#getting-started)

---

## Architecture Overview

This project follows **Clean Architecture** (also known as Onion Architecture), which organizes code into concentric layers with dependencies pointing inward.

```
┌─────────────────────────────────────────────────────────────┐
│                          UI Layer                           │
│         (FastEndpoints, Middlewares, Program.cs)            │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                      │
│    (DbContext, Services, External API integrations)         │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                        │
│      (Interfaces, DTOs, MediatR, AutoMapper Profiles)       │
├─────────────────────────────────────────────────────────────┤
│                       Domain Layer                           │
│              (Entities, Base Classes, Extensions)            │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Domain** | Core business entities, base classes (`BaseEntity`, `AuditableEntity`), validation |
| **Application** | Interfaces, DTOs (Requests/Responses), AutoMapper profiles, MediatR handlers, FluentValidation |
| **Infrastructure** | EF Core DbContext, service implementations, external integrations (JWT, DropBox) |
| **UI** | Controllers, middleware pipeline, dependency injection configuration |

---

## Project Structure

```
DynoDocsApi/
├── Domain/
│   ├── Common/
│   │   ├── AuditableEntity.cs      # Base class with audit fields
│   │   ├── BaseEntity.cs           # Base entity with Id + TenantId
│   │   ├── User.cs                 # User entity
│   │   └── ValidationBase.cs       # Model validation
│   ├── Entities/
│   │   ├── Identity/
│   │   │   ├── Employee.cs
│   │   │   └── Tenant.cs
│   │   └── Operations/
│   │       └── Place.cs
│   └── Extensions/
│
├── Application/
│   ├── Common/
│   │   ├── Interfaces/
│   │   │   ├── IApplicationDbContext.cs
│   │   │   ├── IBaseCrudService.cs      # Generic CRUD interface
│   │   │   ├── ICurrentUserService.cs   # Current user abstraction
│   │   │   ├── ITenantService.cs        # Tenant context abstraction
│   │   │   ├── IJwtService.cs
│   │   │   └── IDropBoxService.cs
│   │   └── Result.cs
│   ├── UserStories/
│   │   └── Places/
│   │       ├── Requests/
│   │       │   └── PlaceRequest.cs
│   │       ├── Responses/
│   │       │   └── PlaceResponse.cs
│   │       ├── IPlaceService.cs
│   │       └── PlaceMappingProfile.cs
│   └── ApplicationDependencyInjection.cs
│
├── Infrastructure/
│   ├── Persistence/
│   │   └── ApplicationDbContext.cs      # EF Core with auto-audit & tenant filtering
│   ├── Services/
│   │   ├── BaseCrudService.cs           # Generic CRUD implementation
│   │   ├── CurrentUserService.cs        # Extracts user from JWT
│   │   ├── TenantService.cs             # Extracts tenant from JWT/middleware
│   │   ├── PlaceService.cs              # Place-specific CRUD
│   │   ├── JwtService.cs
│   │   └── DropBoxService.cs
│   └── InfrastructureDependencyInjection.cs
│
├── UI/
│   ├── Controllers/
│   │   └── Operations/
│   │       └── PlacesController.cs
│   ├── Middlewares/
│   │   ├── ErrorHandlerMiddleware.cs
│   │   └── TenantMiddleware.cs
│   └── Program.cs
│
└── README.md
```

---

## Design Patterns & Practices

### 1. Clean Architecture
- **Dependency Rule**: Inner layers don't know about outer layers
- **Interfaces in Application layer**: Implemented in Infrastructure
- **Testability**: Business logic is isolated from frameworks

### 2. Generic CRUD Service Pattern
- `IBaseCrudService<TEntity, TRequest, TResponse>` provides reusable CRUD operations
- Services inherit from `BaseCrudService` and override only when needed
- Reduces boilerplate while maintaining flexibility

### 3. Repository Pattern (via DbContext)
- `IApplicationDbContext` acts as the abstraction
- EF Core `DbSet<T>` properties serve as repositories
- Global query filters handle tenant isolation

### 4. Unit of Work
- `SaveChangesAsync()` in DbContext handles transaction boundaries
- Audit fields automatically populated on save

### 5. DTO Pattern
- **Requests**: Input DTOs for create/update operations
- **Responses**: Output DTOs with computed/formatted data
- **AutoMapper**: Handles entity ↔ DTO transformations

### 6. Middleware Pipeline
- `ErrorHandlerMiddleware`: Global exception handling
- `TenantMiddleware`: Tenant context extraction from JWT

### 7. Result Pattern
- **Standardized Response**: All CUD operations (Create, Update, Delete) return a `Result` object
- **Properties**: `Succeeded`, `Message`, `Errors`, `DateTime`, `IsPending`, `RequestId`
- **Data Payload**: Use `SetData<T>()` to attach response data; retrieve with `GetData<T>()`
- **Consistent Error Handling**: Clear success/failure status with detailed error messages

---

## Multi-Tenancy

This API implements **row-level multi-tenancy** where all tenants share the same database but data is isolated by `TenantId`.

### How It Works

1. **BaseEntity** includes `TenantId` property:
   ```csharp
   public class BaseEntity : AuditableEntity
   {
       public Guid Id { get; set; }
       public Guid TenantId { get; set; }
   }
   ```

2. **TenantMiddleware** extracts `TenantId` from JWT claims:
   ```csharp
   // From JWT claim "TenantId" or hardcoded fallback for Phase 1
   context.Items["TenantId"] = tenantId;
   ```

3. **TenantService** provides current tenant context:
   ```csharp
   public Guid TenantId => /* from HttpContext.Items or JWT */
   ```

4. **Global Query Filters** in `ApplicationDbContext`:
   ```csharp
   modelBuilder.Entity<TEntity>()
       .HasQueryFilter(e => e.TenantId == _tenantService.TenantId);
   ```

5. **Auto-population** on `SaveChangesAsync`:
   ```csharp
   if (entry.Entity is BaseEntity baseEntity && entry.State == EntityState.Added)
   {
       baseEntity.TenantId = tenantId;
   }
   ```

### Phase 1 (Current)
- Hardcoded `TenantId`: `00000000-0000-0000-0000-000000000001`
- Hardcoded `UserName`: `"system"`

### Phase 2 (Future)
- Login/Registration endpoints
- JWT tokens with real `TenantId` and user claims

---

## CRUD Service Pattern

### Interface Definition
```csharp
public interface IBaseCrudService<TEntity, TRequest, TResponse>
{
    Task<IEnumerable<TResponse>> GetAllAsync(CancellationToken ct = default);
    Task<TResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<Result> CreateAsync(TRequest request, CancellationToken ct = default);
    Task<Result> UpdateAsync(Guid id, TRequest request, CancellationToken ct = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken ct = default);
}
```

### Result Pattern for CUD Operations

All **Create**, **Update**, and **Delete** operations return a `Result` object instead of direct data types. This provides:

- **Consistent Response Structure**: Standardized success/failure format across all operations
- **Error Details**: Clear error messages in the `Errors` array
- **Data Embedding**: Response data embedded using `SetData<T>()` method
- **Metadata**: Includes timestamp, message, and optional request ID

**Example Result Usage:**
```csharp
var result = await _placeService.CreateAsync(request, ct);

if (result.Succeeded)
{
    var createdPlace = result.GetData<PlaceResponse>();
    // Handle success
}
else
{
    // Handle errors: result.Errors, result.Message
}
```

**Result Properties:**
- `Succeeded` (bool): Indicates operation success
- `Message` (string): Descriptive message about the operation
- `Errors` (string[]): Array of error messages (empty on success)
- `DateTime` (DateTime): Timestamp of the operation
- `IsPending` (bool): Indicates if operation is asynchronous/pending
- `RequestId` (string): Optional request identifier for tracking

### Creating a New Service

1. **Define entity-specific interface** (optional, for custom methods):
   ```csharp
   public interface IPlaceService : IBaseCrudService<Place, PlaceRequest, PlaceResponse>
   {
       // Add custom methods if needed
   }
   ```

2. **Implement the service**:
   ```csharp
   public class PlaceService : BaseCrudService<Place, PlaceRequest, PlaceResponse>, IPlaceService
   {
       public PlaceService(/* dependencies */) : base(/* ... */) { }
       
       protected override DbSet<Place> DbSet => DbContext.Places;
   }
   ```

3. **Register in DI**:
   ```csharp
   services.AddScoped<IPlaceService, PlaceService>();
   ```

---

## Controllers

We use ASP.NET Core Controllers with a RESTful API design pattern for scalable and maintainable API endpoints.

### Advantages
- **Standard MVC Pattern**: Well-known and widely supported
- **Scalability**: Better suited for large applications
- **Rich Ecosystem**: Full ASP.NET Core middleware support
- **Team Familiarity**: Standard approach most developers know

### Controller Structure
```
UI/Controllers/
└── Operations/
    └── PlacesController.cs
```

### Example Controller
```csharp
[ApiController]
[Route("api/[controller]")]
public class PlacesController : ControllerBase
{
    private readonly IPlaceService _placeService;

    public PlacesController(IPlaceService placeService)
    {
        _placeService = placeService;
    }

    [HttpPost]
    [ProducesResponseType(typeof(Result), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> Create([FromBody] PlaceRequest request, CancellationToken cancellationToken)
    {
        var result = await _placeService.CreateAsync(request, cancellationToken);

        if (result.Succeeded)
        {
            return StatusCode(StatusCodes.Status201Created, result);
        }

        return BadRequest(result);
    }

    [HttpGet]
    public async Task<ActionResult<List<PlaceResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var places = await _placeService.GetAllAsync(cancellationToken);
        return Ok(places.ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PlaceResponse>> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var place = await _placeService.GetByIdAsync(id, cancellationToken);
        if (place == null)
        {
            return NotFound();
        }
        return Ok(place);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Result>> Update([FromRoute] Guid id, [FromBody] PlaceRequest request, CancellationToken cancellationToken)
    {
        var result = await _placeService.UpdateAsync(id, request, cancellationToken);
        if (result.Succeeded)
        {
            return Ok(result);
        }
        return BadRequest(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Result>> Delete([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await _placeService.DeleteAsync(id, cancellationToken);
        if (result.Succeeded)
        {
            return Ok(result);
        }
        return BadRequest(result);
    }
}
```

**Response Format:**
```json
{
  "succeeded": true,
  "message": "Place created successfully",
  "errors": [],
  "dateTime": "2026-01-04T10:30:00Z",
  "isPending": false,
  "data": {
    "id": "...",
    "name": "...",
    ...
  }
}
```

---

## How to Extend

### Adding a New Entity with Full CRUD

1. **Create the Entity** (`Domain/Entities/Operations/YourEntity.cs`):
   ```csharp
   public class YourEntity : BaseEntity
   {
       public required string Name { get; set; }
       // ... other properties
   }
   ```

2. **Create DTOs** (`Application/UserStories/YourEntities/`):
   ```
   Requests/YourEntityRequest.cs
   Responses/YourEntityResponse.cs
   ```

3. **Create AutoMapper Profile** (`Application/UserStories/YourEntities/YourEntityMappingProfile.cs`):
   ```csharp
   public class YourEntityMappingProfile : Profile
   {
       public YourEntityMappingProfile()
       {
           CreateMap<YourEntityRequest, YourEntity>();
           CreateMap<YourEntity, YourEntityResponse>();
       }
   }
   ```

4. **Add DbSet** to `IApplicationDbContext` and `ApplicationDbContext`:
   ```csharp
   DbSet<YourEntity> YourEntities { get; }
   ```

5. **Create Service Interface** (`Application/UserStories/YourEntities/IYourEntityService.cs`):
   ```csharp
   public interface IYourEntityService : IBaseCrudService<YourEntity, YourEntityRequest, YourEntityResponse> { }
   ```

6. **Create Service Implementation** (`Infrastructure/Services/YourEntityService.cs`):
   ```csharp
   public class YourEntityService : BaseCrudService<YourEntity, YourEntityRequest, YourEntityResponse>, IYourEntityService
   {
       protected override DbSet<YourEntity> DbSet => DbContext.YourEntities;
       // constructor...
   }
   ```

7. **Register Service** in `InfrastructureDependencyInjection.cs`:
   ```csharp
   services.AddScoped<IYourEntityService, YourEntityService>();
   ```

8. **Create Controller** (`UI/Controllers/Operations/YourEntitiesController.cs`):
   ```csharp
   [ApiController]
   [Route("api/[controller]")]
   public class YourEntitiesController : ControllerBase
   {
       private readonly IYourEntityService _service;

       public YourEntitiesController(IYourEntityService service)
       {
           _service = service;
       }

       [HttpPost]
       public async Task<ActionResult<Result>> Create([FromBody] YourEntityRequest request, CancellationToken ct)
       {
           var result = await _service.CreateAsync(request, ct);
           return result.Succeeded ? StatusCode(201, result) : BadRequest(result);
       }

       [HttpGet]
       public async Task<ActionResult<List<YourEntityResponse>>> GetAll(CancellationToken ct)
       {
           var items = await _service.GetAllAsync(ct);
           return Ok(items.ToList());
       }

       [HttpGet("{id}")]
       public async Task<ActionResult<YourEntityResponse>> GetById([FromRoute] Guid id, CancellationToken ct)
       {
           var item = await _service.GetByIdAsync(id, ct);
           return item == null ? NotFound() : Ok(item);
       }

       [HttpPut("{id}")]
       public async Task<ActionResult<Result>> Update([FromRoute] Guid id, [FromBody] YourEntityRequest request, CancellationToken ct)
       {
           var result = await _service.UpdateAsync(id, request, ct);
           return result.Succeeded ? Ok(result) : BadRequest(result);
       }

       [HttpDelete("{id}")]
       public async Task<ActionResult<Result>> Delete([FromRoute] Guid id, CancellationToken ct)
       {
           var result = await _service.DeleteAsync(id, ct);
           return result.Succeeded ? Ok(result) : BadRequest(result);
       }
   }
   ```

9. **Run EF Migration**:
   ```bash
   dotnet ef migrations add AddYourEntity -p Infrastructure -s UI
   dotnet ef database update -p Infrastructure -s UI
   ```

---

## Getting Started

### Prerequisites
- .NET 8 SDK
- MySQL Server (or update connection string for your database)

### Configuration
Update `appsettings.json` with your database connection:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DynoDocs;User=root;Password=yourpassword;"
  }
}
```

### Running the Application
```bash
cd UI
dotnet run
```

### API Documentation
Swagger UI is available at: `https://localhost:{port}/swagger`

### Available Endpoints (Phase 1)
| Method | Endpoint | Description | Response Type | Parameters |
|--------|----------|-------------|---------------|------------|
| GET | `/api/places` | Get all places | `List<PlaceResponse>` | - |
| GET | `/api/places/{id}` | Get place by ID | `PlaceResponse` | `id` (route param) |
| POST | `/api/places` | Create new place | `Result` (with embedded `PlaceResponse`) | Body: `PlaceRequest` |
| PUT | `/api/places/{id}` | Update place | `Result` (with embedded `PlaceResponse`) | `id` (route param), Body: `PlaceRequest` |
| DELETE | `/api/places/{id}` | Delete place | `Result` | `id` (route param) |

**Note**: 
- CUD operations (Create, Update, Delete) return a standardized `Result` object with success/failure status, messages, and embedded data.
- **Route Parameter Usage**: Get by ID, Update, and Delete operations use route parameters for the ID (`{id}` in the URL path).
- Update endpoint receives Place properties (`name`, `description`, `district`, `city`) from the request body, while the `id` comes from the route parameter.

---

## Future Enhancements (Phase 2)

- [ ] User Registration & Login endpoints
- [ ] JWT authentication enforcement
- [ ] Role-based authorization
- [ ] Pagination support (`PagedResult<T>`)
- [ ] Audit logging
- [ ] Soft delete option

---

## Technologies Used

- **.NET 8** - Framework
- **ASP.NET Core Controllers** - RESTful API framework
- **Entity Framework Core** - ORM
- **MySQL (Pomelo)** - Database provider
- **AutoMapper** - Object mapping
- **FluentValidation** - Input validation
- **MediatR** - CQRS/Mediator pattern (ready for use)
- **JWT Bearer** - Authentication

---

## License

This project is proprietary software. All rights reserved.

