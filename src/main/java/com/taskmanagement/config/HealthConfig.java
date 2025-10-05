package com.taskmanagement.config;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.info.InfoContributor;
import org.springframework.boot.actuate.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Configuration for custom health indicators and info contributors
 */
@Configuration
public class HealthConfig {

    /**
     * Custom health indicator for database connectivity and performance
     */
    @Bean
    public HealthIndicator databaseHealthIndicator(DataSource dataSource) {
        return new DatabaseHealthIndicator(dataSource);
    }

    /**
     * Custom health indicator for Redis connectivity and performance
     */
    @Bean
    public HealthIndicator redisHealthIndicator(RedisTemplate<String, Object> redisTemplate) {
        return new RedisHealthIndicator(redisTemplate);
    }

    /**
     * Custom info contributor for application runtime information
     */
    @Bean
    public InfoContributor customInfoContributor() {
        return new CustomInfoContributor();
    }

    /**
     * Database health indicator implementation
     */
    private static class DatabaseHealthIndicator implements HealthIndicator {
        private final DataSource dataSource;

        public DatabaseHealthIndicator(DataSource dataSource) {
            this.dataSource = dataSource;
        }

        @Override
        public Health health() {
            try {
                JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
                
                // Test basic connectivity
                long startTime = System.currentTimeMillis();
                Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
                long responseTime = System.currentTimeMillis() - startTime;
                
                if (result != null && result == 1) {
                    // Get additional database information
                    Map<String, Object> details = new HashMap<>();
                    details.put("responseTime", responseTime + "ms");
                    
                    try {
                        // Get database version
                        String version = jdbcTemplate.queryForObject("SELECT version()", String.class);
                        details.put("version", version != null ? version.split(" ")[0] : "unknown");
                        
                        // Get connection count (PostgreSQL specific)
                        Integer connections = jdbcTemplate.queryForObject(
                            "SELECT count(*) FROM pg_stat_activity WHERE state = 'active'", 
                            Integer.class
                        );
                        details.put("activeConnections", connections);
                        
                    } catch (Exception e) {
                        details.put("additionalInfo", "Limited - " + e.getMessage());
                    }
                    
                    return Health.up()
                        .withDetails(details)
                        .build();
                } else {
                    return Health.down()
                        .withDetail("reason", "Database query returned unexpected result")
                        .build();
                }
            } catch (Exception e) {
                return Health.down()
                    .withDetail("error", e.getMessage())
                    .withDetail("errorClass", e.getClass().getSimpleName())
                    .build();
            }
        }
    }

    /**
     * Redis health indicator implementation
     */
    private static class RedisHealthIndicator implements HealthIndicator {
        private final RedisTemplate<String, Object> redisTemplate;

        public RedisHealthIndicator(RedisTemplate<String, Object> redisTemplate) {
            this.redisTemplate = redisTemplate;
        }

        @Override
        public Health health() {
            try {
                long startTime = System.currentTimeMillis();
                
                // Test Redis connectivity with ping
                String pong = redisTemplate.getConnectionFactory()
                    .getConnection()
                    .ping();
                
                long responseTime = System.currentTimeMillis() - startTime;
                
                if ("PONG".equals(pong)) {
                    Map<String, Object> details = new HashMap<>();
                    details.put("responseTime", responseTime + "ms");
                    
                    try {
                        // Get Redis info
                        var connection = redisTemplate.getConnectionFactory().getConnection();
                        var info = connection.info();
                        
                        if (info != null && info.getProperty("redis_version") != null) {
                            details.put("version", info.getProperty("redis_version"));
                            details.put("connectedClients", info.getProperty("connected_clients"));
                            details.put("usedMemory", info.getProperty("used_memory_human"));
                        }
                        
                        connection.close();
                    } catch (Exception e) {
                        details.put("additionalInfo", "Limited - " + e.getMessage());
                    }
                    
                    return Health.up()
                        .withDetails(details)
                        .build();
                } else {
                    return Health.down()
                        .withDetail("reason", "Redis ping returned unexpected response: " + pong)
                        .build();
                }
            } catch (Exception e) {
                return Health.down()
                    .withDetail("error", e.getMessage())
                    .withDetail("errorClass", e.getClass().getSimpleName())
                    .build();
            }
        }
    }

    /**
     * Custom info contributor implementation
     */
    private static class CustomInfoContributor implements InfoContributor {
        @Override
        public void contribute(Info.Builder builder) {
            Map<String, Object> runtimeInfo = new HashMap<>();
            
            // JVM information
            Runtime runtime = Runtime.getRuntime();
            runtimeInfo.put("processors", runtime.availableProcessors());
            runtimeInfo.put("maxMemory", formatBytes(runtime.maxMemory()));
            runtimeInfo.put("totalMemory", formatBytes(runtime.totalMemory()));
            runtimeInfo.put("freeMemory", formatBytes(runtime.freeMemory()));
            runtimeInfo.put("usedMemory", formatBytes(runtime.totalMemory() - runtime.freeMemory()));
            
            // System properties
            runtimeInfo.put("javaVersion", System.getProperty("java.version"));
            runtimeInfo.put("javaVendor", System.getProperty("java.vendor"));
            runtimeInfo.put("osName", System.getProperty("os.name"));
            runtimeInfo.put("osVersion", System.getProperty("os.version"));
            runtimeInfo.put("osArch", System.getProperty("os.arch"));
            
            // Application startup time
            runtimeInfo.put("startupTime", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            builder.withDetail("runtime", runtimeInfo);
            
            // Custom application info
            Map<String, Object> appInfo = new HashMap<>();
            appInfo.put("description", "Task Management API for team collaboration");
            appInfo.put("features", new String[]{
                "User Management", 
                "Team Collaboration", 
                "Project Management", 
                "Task Tracking", 
                "Real-time Notifications",
                "Activity Audit Trail",
                "Rate Limiting",
                "Caching"
            });
            
            builder.withDetail("application", appInfo);
        }
        
        private String formatBytes(long bytes) {
            if (bytes < 1024) return bytes + " B";
            int exp = (int) (Math.log(bytes) / Math.log(1024));
            String pre = "KMGTPE".charAt(exp - 1) + "";
            return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
        }
    }
}