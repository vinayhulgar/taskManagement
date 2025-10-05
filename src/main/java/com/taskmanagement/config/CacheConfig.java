package com.taskmanagement.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class CacheConfig {

    // Cache names
    public static final String USER_CACHE = "users";
    public static final String TEAM_CACHE = "teams";
    public static final String PROJECT_CACHE = "projects";
    public static final String TASK_CACHE = "tasks";
    public static final String RATE_LIMIT_CACHE = "rate_limits";

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        // Default cache configuration
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        // Specific cache configurations
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        
        // User cache - longer TTL as user data changes less frequently
        cacheConfigurations.put(USER_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(30)));
        
        // Team cache - medium TTL
        cacheConfigurations.put(TEAM_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(20)));
        
        // Project cache - medium TTL
        cacheConfigurations.put(PROJECT_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(15)));
        
        // Task cache - shorter TTL as tasks change frequently
        cacheConfigurations.put(TASK_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(5)));
        
        // Rate limit cache - very short TTL for rate limiting windows
        cacheConfigurations.put(RATE_LIMIT_CACHE, defaultConfig.entryTtl(Duration.ofMinutes(1)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        
        // Use String serializer for keys
        template.setKeySerializer(new StringRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        
        // Use JSON serializer for values
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        
        template.setDefaultSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        
        return template;
    }
}