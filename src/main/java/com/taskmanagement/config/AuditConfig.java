package com.taskmanagement.config;

import com.taskmanagement.service.AuditService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import jakarta.persistence.PostPersist;
import jakarta.persistence.PostRemove;
import jakarta.persistence.PostUpdate;
import jakarta.persistence.PreRemove;
import jakarta.persistence.PreUpdate;

/**
 * Configuration for JPA auditing and entity listeners
 */
@Configuration
@EnableJpaAuditing
public class AuditConfig {
    
    private static AuditService auditService;
    
    @Autowired
    public void setAuditService(AuditService auditService) {
        AuditConfig.auditService = auditService;
    }
    
    public static AuditService getAuditService() {
        return auditService;
    }
}