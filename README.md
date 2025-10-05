# Task Management API

A RESTful API for team collaboration and task management built with Spring Boot.

## Features

- User authentication and authorization with JWT
- Team and project management
- Task creation and assignment with subtask support
- Activity tracking and notifications
- Rate limiting and caching
- Comprehensive API documentation with OpenAPI 3.0

## Technology Stack

- **Framework**: Spring Boot 3.2.0 with Java 17
- **Database**: PostgreSQL with HikariCP connection pooling
- **Caching**: Redis
- **Security**: Spring Security with JWT
- **Documentation**: OpenAPI 3.0 with Swagger UI
- **Migration**: Flyway
- **Testing**: JUnit 5, TestContainers

## Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- PostgreSQL 12 or higher
- Redis 6 or higher

## Getting Started

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE taskmanagement_dev;
CREATE USER taskmanagement WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE taskmanagement_dev TO taskmanagement;
```

### 2. Environment Variables

Set the following environment variables or update `application.yml`:

```bash
export DB_USERNAME=taskmanagement
export DB_PASSWORD=password
export JWT_SECRET_KEY=your-secret-key-here
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

### 3. Build and Run

```bash
# Build the project
mvn clean compile

# Run tests
mvn test

# Start the application
mvn spring-boot:run
```

The API will be available at `http://localhost:8080/api/v1`

### 4. API Documentation

Once the application is running, you can access:

- **Swagger UI**: http://localhost:8080/api/v1/swagger-ui.html
- **OpenAPI Spec**: http://localhost:8080/api/v1/api-docs

## Project Structure

```
src/
├── main/
│   ├── java/com/taskmanagement/
│   │   ├── config/          # Configuration classes
│   │   ├── controller/      # REST controllers
│   │   ├── dto/            # Data Transfer Objects
│   │   ├── entity/         # JPA entities
│   │   ├── repository/     # Data repositories
│   │   ├── service/        # Business logic
│   │   └── TaskManagementApiApplication.java
│   └── resources/
│       ├── application.yml  # Application configuration
│       └── db/migration/   # Database migration scripts
└── test/
    ├── java/               # Test classes
    └── resources/          # Test resources
```

## Configuration Profiles

- **development**: Local development with debug logging
- **test**: Test environment with H2 in-memory database
- **production**: Production environment with optimized settings

## Health Checks

The application includes Spring Actuator endpoints:

- **Health**: http://localhost:8080/api/v1/actuator/health
- **Info**: http://localhost:8080/api/v1/actuator/info
- **Metrics**: http://localhost:8080/api/v1/actuator/metrics

## Development

### Running Tests

```bash
# Run all tests
mvn test

# Run specific test class
mvn test -Dtest=TaskManagementApiApplicationTests

# Run tests with coverage
mvn test jacoco:report
```

### Database Migrations

Database migrations are managed with Flyway. Migration scripts should be placed in `src/main/resources/db/migration/` with the naming convention:

```
V{version}__{description}.sql
```

Example: `V1__Create_users_table.sql`

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new functionality
3. Update documentation as needed
4. Ensure all tests pass before submitting changes

## License

This project is licensed under the MIT License.