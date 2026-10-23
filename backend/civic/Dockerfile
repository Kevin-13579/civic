# Multi-stage Dockerfile for CivicFix Spring Boot Backend on AWS (ECS / App Runner / Elastic Beanstalk)
FROM maven:3.9.6-eclipse-temurin-17-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests

# Runtime Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security compliance
RUN addgroup -S civicgroup && adduser -S civicuser -G civicgroup && mkdir -p /app/uploads && chown -R civicuser:civicgroup /app
USER civicuser

COPY --from=builder /app/target/civic-0.0.1-SNAPSHOT.jar app.jar

ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=prod \
    FILE_UPLOAD_DIR=/app/uploads/

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
