package com.taskmanagement.config;

import io.micrometer.core.aop.TimedAspect;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@Configuration
@EnableAspectJAutoProxy
public class MetricsConfig {

    @Bean
    public TimedAspect timedAspect(MeterRegistry registry) {
        return new TimedAspect(registry);
    }

    /**
     * Custom timer for database operations
     */
    @Bean
    public Timer databaseTimer(MeterRegistry meterRegistry) {
        return Timer.builder("database.operations")
                .description("Database operation execution time")
                .register(meterRegistry);
    }

    /**
     * Custom timer for API operations
     */
    @Bean
    public Timer apiTimer(MeterRegistry meterRegistry) {
        return Timer.builder("api.operations")
                .description("API operation execution time")
                .register(meterRegistry);
    }

    /**
     * Custom timer for cache operations
     */
    @Bean
    public Timer cacheTimer(MeterRegistry meterRegistry) {
        return Timer.builder("cache.operations")
                .description("Cache operation execution time")
                .register(meterRegistry);
    }
}