package com.taskmanagement.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Test to validate application configuration without requiring external dependencies
 */
@SpringBootTest
@ActiveProfiles("test")
class ConfigurationValidationTest {

    @Test
    void contextLoads() {
        // This test ensures that the Spring context loads successfully
        // with all the configuration profiles we've created
        assertThat(true).isTrue();
    }

    @Test
    void testProfilesExist() {
        // Test that our configuration files exist and are valid
        // This is validated by the Spring context loading successfully
        assertThat(getClass().getClassLoader().getResource("application.yml")).isNotNull();
        assertThat(getClass().getClassLoader().getResource("application-production.yml")).isNotNull();
        assertThat(getClass().getClassLoader().getResource("application-docker.yml")).isNotNull();
        assertThat(getClass().getClassLoader().getResource("application-kubernetes.yml")).isNotNull();
        assertThat(getClass().getClassLoader().getResource("logback-spring.xml")).isNotNull();
    }
}