package com.taskmanagement.entity;

import com.taskmanagement.config.AuditConfig;
import com.taskmanagement.service.AuditService;
import jakarta.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Base class for auditable entities with JPA listeners
 */
@MappedSuperclass
@EntityListeners(AuditableEntity.AuditListener.class)
public abstract class AuditableEntity {
    
    public abstract UUID getId();
    public abstract String getEntityName();
    
    public static class AuditListener {
        
        private static final Logger logger = LoggerFactory.getLogger(AuditListener.class);
        private final Map<Object, Map<String, Object>> preUpdateState = new HashMap<>();
        
        @PostPersist
        public void postPersist(Object entity) {
            try {
                if (entity instanceof AuditableEntity auditableEntity) {
                    AuditService auditService = AuditConfig.getAuditService();
                    if (auditService != null) {
                        String entityType = entity.getClass().getSimpleName();
                        UUID entityId = auditableEntity.getId();
                        String entityName = auditableEntity.getEntityName();
                        
                        Map<String, Object> newValues = getEntityValues(entity);
                        auditService.logCreate(entityType, entityId, entityName, newValues);
                    }
                }
            } catch (Exception e) {
                logger.error("Error in postPersist audit logging", e);
            }
        }
        
        @PreUpdate
        public void preUpdate(Object entity) {
            try {
                if (entity instanceof AuditableEntity) {
                    Map<String, Object> oldValues = getEntityValues(entity);
                    preUpdateState.put(entity, oldValues);
                }
            } catch (Exception e) {
                logger.error("Error in preUpdate audit logging", e);
            }
        }
        
        @PostUpdate
        public void postUpdate(Object entity) {
            try {
                if (entity instanceof AuditableEntity auditableEntity) {
                    AuditService auditService = AuditConfig.getAuditService();
                    if (auditService != null) {
                        String entityType = entity.getClass().getSimpleName();
                        UUID entityId = auditableEntity.getId();
                        String entityName = auditableEntity.getEntityName();
                        
                        Map<String, Object> oldValues = preUpdateState.remove(entity);
                        Map<String, Object> newValues = getEntityValues(entity);
                        
                        auditService.logUpdate(entityType, entityId, entityName, oldValues, newValues);
                    }
                }
            } catch (Exception e) {
                logger.error("Error in postUpdate audit logging", e);
            }
        }
        
        @PreRemove
        public void preRemove(Object entity) {
            try {
                if (entity instanceof AuditableEntity) {
                    Map<String, Object> oldValues = getEntityValues(entity);
                    preUpdateState.put(entity, oldValues);
                }
            } catch (Exception e) {
                logger.error("Error in preRemove audit logging", e);
            }
        }
        
        @PostRemove
        public void postRemove(Object entity) {
            try {
                if (entity instanceof AuditableEntity auditableEntity) {
                    AuditService auditService = AuditConfig.getAuditService();
                    if (auditService != null) {
                        String entityType = entity.getClass().getSimpleName();
                        UUID entityId = auditableEntity.getId();
                        String entityName = auditableEntity.getEntityName();
                        
                        Map<String, Object> oldValues = preUpdateState.remove(entity);
                        auditService.logDelete(entityType, entityId, entityName, oldValues);
                    }
                }
            } catch (Exception e) {
                logger.error("Error in postRemove audit logging", e);
            }
        }
        
        private Map<String, Object> getEntityValues(Object entity) {
            Map<String, Object> values = new HashMap<>();
            try {
                Class<?> clazz = entity.getClass();
                Field[] fields = clazz.getDeclaredFields();
                
                for (Field field : fields) {
                    field.setAccessible(true);
                    String fieldName = field.getName();
                    Object fieldValue = field.get(entity);
                    
                    // Skip complex objects and collections to avoid circular references
                    if (fieldValue != null && isSimpleType(fieldValue.getClass())) {
                        values.put(fieldName, fieldValue);
                    }
                }
            } catch (Exception e) {
                logger.warn("Failed to extract entity values for audit", e);
            }
            return values;
        }
        
        private boolean isSimpleType(Class<?> type) {
            return type.isPrimitive() ||
                   type.equals(String.class) ||
                   type.equals(UUID.class) ||
                   Number.class.isAssignableFrom(type) ||
                   type.equals(Boolean.class) ||
                   type.equals(java.time.LocalDateTime.class) ||
                   type.equals(java.time.LocalDate.class) ||
                   type.isEnum();
        }
    }
}