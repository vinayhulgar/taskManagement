package com.taskmanagement.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taskmanagement.dto.ActivityFilterRequest;
import com.taskmanagement.dto.ActivityResponse;
import com.taskmanagement.dto.UserResponse;
import com.taskmanagement.entity.Activity;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.ActivityRepository;
import com.taskmanagement.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Service for managing audit activities and logging
 */
@Service
@Transactional
public class AuditService {
    
    private static final Logger logger = LoggerFactory.getLogger(AuditService.class);
    
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    
    @Autowired
    public AuditService(ActivityRepository activityRepository, 
                       UserRepository userRepository,
                       ObjectMapper objectMapper) {
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Log an activity for audit trail
     */
    public void logActivity(String entityType, UUID entityId, String action, String details) {
        try {
            User currentUser = getCurrentUser();
            if (currentUser != null) {
                Activity activity = new Activity(currentUser, entityType, entityId, action);
                activity.setDetails(details);
                activityRepository.save(activity);
                logger.debug("Activity logged: {} {} by user {}", action, entityType, currentUser.getEmail());
            }
        } catch (Exception e) {
            logger.error("Failed to log activity: {} {} for entity {}", action, entityType, entityId, e);
        }
    }
    
    /**
     * Log an activity with old and new values
     */
    public void logActivity(String entityType, UUID entityId, String action, String details, 
                           Object oldValues, Object newValues) {
        try {
            User currentUser = getCurrentUser();
            if (currentUser != null) {
                Activity activity = new Activity(currentUser, entityType, entityId, action);
                activity.setDetails(details);
                
                if (oldValues != null) {
                    activity.setOldValues(serializeToJson(oldValues));
                }
                if (newValues != null) {
                    activity.setNewValues(serializeToJson(newValues));
                }
                
                activityRepository.save(activity);
                logger.debug("Activity logged with values: {} {} by user {}", action, entityType, currentUser.getEmail());
            }
        } catch (Exception e) {
            logger.error("Failed to log activity with values: {} {} for entity {}", action, entityType, entityId, e);
        }
    }
    
    /**
     * Log CREATE activity
     */
    public void logCreate(String entityType, UUID entityId, String entityName, Object newValues) {
        String details = String.format("%s '%s' was created", entityType, entityName);
        logActivity(entityType, entityId, "CREATE", details, null, newValues);
    }
    
    /**
     * Log UPDATE activity
     */
    public void logUpdate(String entityType, UUID entityId, String entityName, Object oldValues, Object newValues) {
        String details = String.format("%s '%s' was updated", entityType, entityName);
        logActivity(entityType, entityId, "UPDATE", details, oldValues, newValues);
    }
    
    /**
     * Log DELETE activity
     */
    public void logDelete(String entityType, UUID entityId, String entityName, Object oldValues) {
        String details = String.format("%s '%s' was deleted", entityType, entityName);
        logActivity(entityType, entityId, "DELETE", details, oldValues, null);
    }
    
    /**
     * Log ASSIGN activity
     */
    public void logAssign(String entityType, UUID entityId, String entityName, String assigneeName) {
        String details = String.format("%s '%s' was assigned to %s", entityType, entityName, assigneeName);
        logActivity(entityType, entityId, "ASSIGN", details);
    }
    
    /**
     * Log STATUS_CHANGE activity
     */
    public void logStatusChange(String entityType, UUID entityId, String entityName, String oldStatus, String newStatus) {
        String details = String.format("%s '%s' status changed from %s to %s", entityType, entityName, oldStatus, newStatus);
        logActivity(entityType, entityId, "STATUS_CHANGE", details);
    }
    
    /**
     * Get activities with filtering
     */
    @Transactional(readOnly = true)
    public Page<ActivityResponse> getActivities(ActivityFilterRequest filterRequest) {
        Pageable pageable = createPageable(filterRequest);
        Page<Activity> activities;
        
        if (filterRequest.getUserId() != null && filterRequest.getEntityType() != null) {
            User user = userRepository.findById(filterRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
            activities = activityRepository.findByUserAndEntityType(user, filterRequest.getEntityType(), pageable);
        } else if (filterRequest.getUserId() != null && filterRequest.getStartDate() != null && filterRequest.getEndDate() != null) {
            User user = userRepository.findById(filterRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
            activities = activityRepository.findByUserAndTimestampBetween(user, filterRequest.getStartDate(), filterRequest.getEndDate(), pageable);
        } else if (filterRequest.getUserId() != null) {
            User user = userRepository.findById(filterRequest.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
            activities = activityRepository.findByUserOrderByTimestampDesc(user, pageable);
        } else if (filterRequest.getEntityType() != null && filterRequest.getEntityId() != null) {
            List<Activity> activityList = activityRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(
                filterRequest.getEntityType(), filterRequest.getEntityId());
            long totalCount = activityRepository.countByEntityTypeAndEntityId(filterRequest.getEntityType(), filterRequest.getEntityId());
            
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), activityList.size());
            List<Activity> pageContent = activityList.subList(start, end);
            
            activities = new org.springframework.data.domain.PageImpl<>(pageContent, pageable, totalCount);
        } else if (filterRequest.getEntityType() != null) {
            activities = activityRepository.findByEntityTypeOrderByTimestampDesc(filterRequest.getEntityType(), pageable);
        } else if (filterRequest.getAction() != null) {
            activities = activityRepository.findByActionOrderByTimestampDesc(filterRequest.getAction(), pageable);
        } else if (filterRequest.getStartDate() != null && filterRequest.getEndDate() != null) {
            activities = activityRepository.findByTimestampBetween(filterRequest.getStartDate(), filterRequest.getEndDate(), pageable);
        } else {
            activities = activityRepository.findAll(pageable);
        }
        
        return activities.map(this::convertToResponse);
    }
    
    /**
     * Get activities for current user
     */
    @Transactional(readOnly = true)
    public Page<ActivityResponse> getCurrentUserActivities(int page, int size) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new RuntimeException("User not authenticated");
        }
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        Page<Activity> activities = activityRepository.findByUserOrderByTimestampDesc(currentUser, pageable);
        return activities.map(this::convertToResponse);
    }
    
    /**
     * Get activities for a specific entity
     */
    @Transactional(readOnly = true)
    public Page<ActivityResponse> getEntityActivities(String entityType, UUID entityId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        var activities = activityRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(entityType, entityId);
        
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), activities.size());
        
        Page<Activity> activityPage = new org.springframework.data.domain.PageImpl<>(
            activities.subList(start, end), pageable, activities.size()
        );
        
        return activityPage.map(this::convertToResponse);
    }
    
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && 
            !authentication.getPrincipal().equals("anonymousUser")) {
            String email = authentication.getName();
            return userRepository.findByEmail(email).orElse(null);
        }
        return null;
    }
    
    private String serializeToJson(Object object) {
        try {
            return objectMapper.writeValueAsString(object);
        } catch (JsonProcessingException e) {
            logger.warn("Failed to serialize object to JSON: {}", e.getMessage());
            return object.toString();
        }
    }
    
    private Pageable createPageable(ActivityFilterRequest filterRequest) {
        Sort.Direction direction = "asc".equalsIgnoreCase(filterRequest.getSortDirection()) 
            ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, filterRequest.getSortBy());
        return PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
    }
    
    private ActivityResponse convertToResponse(Activity activity) {
        UserResponse userResponse = new UserResponse(
            activity.getUser().getId(),
            activity.getUser().getEmail(),
            activity.getUser().getFirstName(),
            activity.getUser().getLastName(),
            activity.getUser().getRole(),
            activity.getUser().getCreatedAt(),
            activity.getUser().getUpdatedAt(),
            activity.getUser().getLastLogin()
        );
        
        return new ActivityResponse(
            activity.getId(),
            userResponse,
            activity.getEntityType(),
            activity.getEntityId(),
            activity.getAction(),
            activity.getDetails(),
            activity.getOldValues(),
            activity.getNewValues(),
            activity.getTimestamp()
        );
    }
}