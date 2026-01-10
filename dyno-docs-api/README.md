# DynoDocsApi

A multi-tenant .NET 8 Web API built with Clean Architecture principles, CQRS MediaR pattern, and Entity Framework Core.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Design Patterns & Practices](#design-patterns--practices)
- [Multi-Tenancy](#multi-tenancy)
- [CQRS MediaR Pattern](#cqrs-mediatr-pattern)
- [Controllers](#controllers)
- [How to Extend](#how-to-extend)
- [Getting Started](#getting-started)

---

## Architecture Overview

This project follows **Clean Architecture** (also known as Onion Architecture), which organizes code into concentric layers with dependencies pointing inward.

```
┌─────────────────────────────────────────────────────────────┐
│                          UI Layer                           │
│        (Controllers, Middlewares, Program.cs)               │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                      │
│    (DbContext, Services, External API integrations)         │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                        │
│      (Commands, Queries, Handlers, MediatR, DTOs)           │
├─────────────────────────────────────────────────────────────┤
│                       Domain Layer                           │
│              (Entities, Base Classes, Extensions)            │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Domain** | Core business entities, base classes (`BaseEntity`, `AuditableEntity`), validation |
| **Application** | Commands, Queries, Request/Response handlers using MediatR, DTOs, FluentValidation |
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
│   │   │   ├── ICurrentUserService.cs   # Current user abstraction
│   │   │   ├── ITenantService.cs        # Tenant context abstraction
│   │   │   ├── IJwtService.cs
│   │   │   └── IDropBoxService.cs
│   │   └── Result.cs
│   ├── UserStories/
│   │   ├── Team/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateTeamMemberCommand.cs
│   │   │   │   ├── UpdateTeamMemberCommand.cs
│   │   │   │   └── DeleteTeamMemberCommand.cs
│   │   │   └── Queries/
│   │   │       └── GetTeamMembersQuery.cs
│   │   └── Places/
│   │       ├── Commands/
│   │       │   ├── CreatePlaceCommand.cs
│   │       │   ├── UpdatePlaceCommand.cs
│   │       │   └── DeletePlaceCommand.cs
│   │       └── Queries/
│   │           └── GetPlacesQuery.cs
│   └── ApplicationDependencyInjection.cs
│
├── Infrastructure/
│   ├── Persistence/
│   │   └── ApplicationDbContext.cs      # EF Core with auto-audit & tenant filtering
│   ├── Services/
│   │   ├── CurrentUserService.cs        # Extracts user from JWT
│   │   ├── TenantService.cs             # Extracts tenant from JWT/middleware
│   │   ├── JwtService.cs
│   │   └── DropBoxService.cs
│   └── InfrastructureDependencyInjection.cs
│
├── UI/
│   ├── Controllers/
│   │   ├── TeamController.cs
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

### 2. CQRS with MediaR Pattern
- **Commands**: Handle create, update, and delete operations that modify state
- **Queries**: Handle read operations that return data
- **Handlers**: Implement `IRequestHandler<TRequest, TResponse>` for each command/query
- **Separation of Concerns**: Read and write operations are separated for better maintainability

### 3. Repository Pattern (via DbContext)
- `IApplicationDbContext` acts as the abstraction
- EF Core `DbSet<T>` properties serve as repositories
- Command/Query handlers access DbContext directly for data operations
- Global query filters handle tenant isolation

### 4. Unit of Work
- `SaveChangesAsync()` in DbContext handles transaction boundaries
- Audit fields automatically populated on save

### 5. DTO Pattern
- **Commands**: Input DTOs for create/update/delete operations that implement `IRequest<Result>`
- **Queries**: Input DTOs for read operations that implement `IRequest<TResponse>`
- **Response DTOs**: Output DTOs with computed/formatted data
- **AutoMapper**: Can be used for entity ↔ DTO transformations in handlers

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

## CQRS MediaR Pattern

This project uses **CQRS (Command Query Responsibility Segregation)** with **MediatR** to separate read and write operations, making the codebase more maintainable and scalable.

### Pattern Overview

```
Controller → MediatR → Handler → DbContext → Database
```

### Commands (Write Operations)

Commands handle operations that modify state (Create, Update, Delete). They return a `Result` object for consistent response handling.

```csharp
public class CreateTeamMemberCommand : IRequest<Result>
{
    [MaxLength(300)]
    public required string Name { get; set; }
    
    [MaxLength(500)]
    public string? Position { get; set; }

    public required IFormFile ImageUrl { get; set; }
}

public class CreateTeamMemberCommandHandler : IRequestHandler<CreateTeamMemberCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IDropBoxService _dropBoxService;

    public CreateTeamMemberCommandHandler(IApplicationDbContext context, IDropBoxService dropBoxService)
    {
        _context = context;
        _dropBoxService = dropBoxService;
    }

    public async Task<Result> Handle(CreateTeamMemberCommand request, CancellationToken cancellationToken)
    {
        var imageLink = await _dropBoxService.UploadImageAsync(request.ImageUrl, "team");
        
        var teamMember = new Domain.Entities.Teams.Team
        {
            Name = request.Name,
            Position = request.Position,    
            ImageUrl = imageLink
        };

        _context.Team.Add(teamMember);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success("Team member created successfully.");
    }
}
```

### Queries (Read Operations)

Queries handle operations that retrieve data. They return specific response DTOs or lists of data.

```csharp
public record GetTeamMembersQuery : IRequest<List<TeamResponse>>;

public class GetTeamMembersQueryHandler : IRequestHandler<GetTeamMembersQuery, List<TeamResponse>>
{
    private readonly IApplicationDbContext _context;

    public GetTeamMembersQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<List<TeamResponse>> Handle(GetTeamMembersQuery request, CancellationToken cancellationToken)
    {
        var teamMembers = await _context.Team
            .Select(tm => new TeamResponse
            {
                Id = tm.Id,
                Name = tm.Name,
                Position = tm.Position,
                ImageUrl = tm.ImageUrl
            })
            .ToListAsync(cancellationToken);

        return teamMembers;
    }
}

public class TeamResponse
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public string? Position { get; set; }
    public required string ImageUrl { get; set; }
}
```

### Result Pattern for Commands

All **Create**, **Update**, and **Delete** operations return a `Result` object instead of direct data types. This provides:

- **Consistent Response Structure**: Standardized success/failure format across all operations
- **Error Details**: Clear error messages in the `Errors` array
- **Data Embedding**: Response data embedded using `SetData<T>()` method
- **Metadata**: Includes timestamp, message, and optional request ID

**Example Result Usage:**
```csharp
var result = await mediator.Send(new CreateTeamMemberCommand { ... }, cancellationToken);

if (result.Succeeded)
{
    // Handle success - result.Message contains success message
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

### Benefits of CQRS MediaR Pattern

1. **Separation of Concerns**: Read and write operations are separated
2. **Simplified Controllers**: Controllers only dispatch commands/queries to MediatR
3. **Testability**: Each handler can be unit tested independently
4. **Flexibility**: Different optimization strategies for reads vs writes
5. **Maintainability**: Single responsibility principle for each handler
6. **Pipeline Behaviors**: Cross-cutting concerns (validation, logging) via MediatR behaviors

---

## Controllers

We use ASP.NET Core Controllers with MediatR integration for clean separation between HTTP layer and business logic.

### Advantages
- **Clean Separation**: Controllers only handle HTTP concerns, business logic in handlers
- **Simplified Controllers**: Just dispatch commands/queries to MediatR
- **Testability**: Business logic tested independently from HTTP layer
- **Consistency**: All operations follow the same pattern

### Controller Structure
```
UI/Controllers/
├── TeamController.cs
└── Operations/
    └── PlacesController.cs
```

### Example Controller with MediatR
```csharp
[ApiController]
[Route("api/teams")]
public class TeamController(IMediator mediator) : ControllerBase
{
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<Result>> CreateTeamMember([FromForm] CreateTeamMemberCommand request)
        => await mediator.Send(request);
    
    [Authorize]
    [HttpPut]
    public async Task<ActionResult<Result>> UpdateTeamMember([FromForm] UpdateTeamMemberCommand request)
        => await mediator.Send(request);

    [Authorize]
    [HttpDelete]
    public async Task<ActionResult<Result>> DeleteTeamMember([FromQuery] DeleteTeamMemberCommand request)
        => await mediator.Send(request);
    
    [HttpGet]
    public async Task<ActionResult<List<TeamResponse>>> GetTeams()
        => await mediator.Send(new GetTeamMembersQuery());
}
```

### Controller Pattern
1. **Inject IMediator**: Constructor injection of MediatR mediator
2. **Create Commands/Queries**: Map HTTP request data to command/query objects
3. **Dispatch to MediatR**: Use `mediator.Send()` to execute the operation
4. **Return Result**: Return the result directly from the handler

### HTTP Response Handling
- **Commands**: Return `Result` object with success/failure status
- **Queries**: Return data directly (e.g., `List<TeamResponse>`)
- **Error Handling**: Let MediatR pipeline behaviors handle exceptions

---

## How to Extend

### Adding a New Entity with Full CRUD using CQRS

Follow these steps to add a new entity with complete CRUD operations using the CQRS MediaR pattern.

#### 1. Create the Entity (`Domain/Entities/Operations/YourEntity.cs`)
```csharp
public class YourEntity : BaseEntity
{
    public required string Name { get; set; }
    // ... other properties
}
```

#### 2. Add DbSet to DbContext
Add the entity to `IApplicationDbContext` and `ApplicationDbContext`:
```csharp
DbSet<YourEntity> YourEntities { get; }
```

#### 3. Create Commands (`Application/UserStories/YourEntities/Commands/`)

**CreateYourEntityCommand.cs:**
```csharp
public class CreateYourEntityCommand : IRequest<Result>
{
    [MaxLength(300)]
    public required string Name { get; set; }
    // ... other properties
}

public class CreateYourEntityCommandHandler : IRequestHandler<CreateYourEntityCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public CreateYourEntityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(CreateYourEntityCommand request, CancellationToken cancellationToken)
    {
        var entity = new YourEntity
        {
            Name = request.Name
            // Map other properties
        };

        _context.YourEntities.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success("YourEntity created successfully.");
    }
}
```

**UpdateYourEntityCommand.cs:**
```csharp
public class UpdateYourEntityCommand : IRequest<Result>
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    // ... other properties
}

public class UpdateYourEntityCommandHandler : IRequestHandler<UpdateYourEntityCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public UpdateYourEntityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(UpdateYourEntityCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.YourEntities
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            return Result.Failure("YourEntity not found.");
        }

        entity.Name = request.Name;
        // Update other properties

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success("YourEntity updated successfully.");
    }
}
```

**DeleteYourEntityCommand.cs:**
```csharp
public class DeleteYourEntityCommand : IRequest<Result>
{
    public Guid Id { get; set; }
}

public class DeleteYourEntityCommandHandler : IRequestHandler<DeleteYourEntityCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteYourEntityCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteYourEntityCommand request, CancellationToken cancellationToken)
    {
        var entity = await _context.YourEntities
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            return Result.Failure("YourEntity not found.");
        }

        _context.YourEntities.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success("YourEntity deleted successfully.");
    }
}
```

#### 4. Create Queries (`Application/UserStories/YourEntities/Queries/`)

**GetYourEntitiesQuery.cs:**
```csharp
public record GetYourEntitiesQuery : IRequest<List<YourEntityResponse>>;

public class GetYourEntitiesQueryHandler : IRequestHandler<GetYourEntitiesQuery, List<YourEntityResponse>>
{
    private readonly IApplicationDbContext _context;

    public GetYourEntitiesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<YourEntityResponse>> Handle(GetYourEntitiesQuery request, CancellationToken cancellationToken)
    {
        return await _context.YourEntities
            .Select(e => new YourEntityResponse
            {
                Id = e.Id,
                Name = e.Name
                // Map other properties
            })
            .ToListAsync(cancellationToken);
    }
}

public class YourEntityResponse
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    // ... other properties
}
```

**GetYourEntityByIdQuery.cs:**
```csharp
public record GetYourEntityByIdQuery(Guid Id) : IRequest<YourEntityResponse?>;

public class GetYourEntityByIdQueryHandler : IRequestHandler<GetYourEntityByIdQuery, YourEntityResponse?>
{
    private readonly IApplicationDbContext _context;

    public GetYourEntityByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<YourEntityResponse?> Handle(GetYourEntityByIdQuery request, CancellationToken cancellationToken)
    {
        return await _context.YourEntities
            .Where(e => e.Id == request.Id)
            .Select(e => new YourEntityResponse
            {
                Id = e.Id,
                Name = e.Name
                // Map other properties
            })
            .FirstOrDefaultAsync(cancellationToken);
    }
}
```

#### 5. Create Controller (`UI/Controllers/YourEntitiesController.cs`)
```csharp
[ApiController]
[Route("api/your-entities")]
public class YourEntitiesController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<Result>> Create([FromBody] CreateYourEntityCommand request)
        => await mediator.Send(request);

    [HttpGet]
    public async Task<ActionResult<List<YourEntityResponse>>> GetAll()
        => await mediator.Send(new GetYourEntitiesQuery());

    [HttpGet("{id}")]
    public async Task<ActionResult<YourEntityResponse>> GetById([FromRoute] Guid id)
    {
        var result = await mediator.Send(new GetYourEntityByIdQuery(id));
        return result == null ? NotFound() : Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Result>> Update([FromRoute] Guid id, [FromBody] UpdateYourEntityCommand request)
    {
        request.Id = id; // Set ID from route
        return await mediator.Send(request);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<Result>> Delete([FromRoute] Guid id)
        => await mediator.Send(new DeleteYourEntityCommand { Id = id });
}
```

#### 6. Run EF Migration
```bash
dotnet ef migrations add AddYourEntity -p Infrastructure -s UI
dotnet ef database update -p Infrastructure -s UI
```

### Pattern Benefits

- **Single Responsibility**: Each handler has one specific purpose
- **Easy Testing**: Mock `IApplicationDbContext` and test handlers independently
- **No Service Layer**: Controllers communicate directly with handlers via MediatR
- **Consistent Structure**: All features follow the same Commands/Queries pattern
- **Validation**: Add FluentValidation to MediatR pipeline for automatic validation

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
| GET | `/api/teams` | Get all team members | `List<TeamResponse>` | - |
| POST | `/api/teams` | Create new team member | `Result` | Form: `CreateTeamMemberCommand` |
| PUT | `/api/teams` | Update team member | `Result` | Form: `UpdateTeamMemberCommand` |
| DELETE | `/api/teams` | Delete team member | `Result` | Query: `DeleteTeamMemberCommand` |

**Note**: 
- All endpoints use CQRS pattern with Commands and Queries processed via MediatR
- CUD operations (Create, Update, Delete) return a standardized `Result` object with success/failure status and messages
- Commands contain input validation attributes for automatic model validation
- Queries return data directly without wrapping in Result objects

---

## Migration from BaseCrudService to CQRS MediaR

This project has transitioned from a generic BaseCrudService pattern to CQRS with MediatR for improved maintainability and separation of concerns.

### Key Changes Made

| Before (BaseCrudService) | After (CQRS MediaR) |
|--------------------------|---------------------|
| `IBaseCrudService<TEntity, TRequest, TResponse>` | Commands and Queries with `IRequest<TResponse>` |
| Service implementations inheriting from `BaseCrudService` | Individual handlers implementing `IRequestHandler<TRequest, TResponse>` |
| Controllers injecting specific service interfaces | Controllers injecting `IMediator` |
| Service method calls: `await _service.CreateAsync(request)` | MediatR dispatch: `await mediator.Send(command)` |

### Benefits of Migration

1. **Simplified Architecture**: Removed service layer, controllers communicate directly with handlers via MediatR
2. **Single Responsibility**: Each handler has one specific purpose
3. **Better Testability**: Test handlers independently without service layer abstractions
4. **Improved Maintainability**: Clear separation between read (Queries) and write (Commands) operations
5. **Consistent Pattern**: All features follow the same Commands/Queries structure

### Implementation Reference

The **Team** feature demonstrates the complete CQRS implementation:
- Commands: `CreateTeamMemberCommand`, `UpdateTeamMemberCommand`, `DeleteTeamMemberCommand`
- Queries: `GetTeamMembersQuery`
- Controller: `TeamController` using MediatR injection
- Handlers: Individual handler classes for each operation

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
- **MediatR** - CQRS/Mediator pattern implementation
- **AutoMapper** - Object mapping (optional in handlers)
- **FluentValidation** - Input validation
- **JWT Bearer** - Authentication

---

## License

This project is proprietary software. All rights reserved.

