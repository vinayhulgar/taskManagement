package com.taskmanagement.service;

import com.taskmanagement.dto.TaskCreateRequest;
import com.taskmanagement.dto.TaskFilterRequest;
import com.taskmanagement.dto.TaskResponse;
import com.taskmanagement.dto.TaskUpdateRequest;
import com.taskmanagement.dto.PagedTaskResponse;
import com.taskmanagement.dto.UserResponse;
import com.taskmanagement.entity.Project;
import com.taskmanagement.entity.Task;
import com.taskmanagement.entity.User;
import com.taskmanagement.repository.ProjectRepository;
import com.taskmanagement.repository.TaskRepository;
import com.taskmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service class for task management operations
 */
@Service
@Transactional
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    
    @Autowired
    public TaskService(TaskRepository taskRepository, ProjectRepository projectRepository, 
                      UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }
    
    /**
     * Create a new task
     */
    public TaskResponse createTask(UUID projectId, TaskCreateRequest request, UUID currentUserId) {
        // Validate project exists and user has access
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        // Validate current user has access to the project
        validateProjectAccess(project, currentUserId);
        
        // Validate due date is not in the past
        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Due date cannot be in the past");
        }
        
        // Get current user
        User currentUser = userRepository.findById(currentUserId)
            .orElseThrow(() -> new RuntimeException("Current user not found"));
        
        // Create task entity
        Task task = new Task();
        task.setProject(project);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus(request.getStatus());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        task.setCreatedBy(currentUser);
        
        // Set assignee if provided
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new RuntimeException("Assignee not found"));
            
            // Validate assignee has access to the project
            validateProjectAccess(project, request.getAssigneeId());
            task.setAssignee(assignee);
        }
        
        // Set parent task if provided (for subtasks)
        if (request.getParentTaskId() != null) {
            Task parentTask = taskRepository.findById(request.getParentTaskId())
                .orElseThrow(() -> new RuntimeException("Parent task not found"));
            
            // Validate parent task belongs to the same project
            if (!parentTask.getProject().getId().equals(projectId)) {
                throw new RuntimeException("Parent task must belong to the same project");
            }
            
            task.setParentTask(parentTask);
        }
        
        // Save task
        Task savedTask = taskRepository.save(task);
        
        return convertToTaskResponse(savedTask);
    }
    
    /**
     * Get task by ID
     */
    @Transactional(readOnly = true)
    public TaskResponse getTaskById(UUID taskId, UUID currentUserId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        // Validate user has access to the project
        validateProjectAccess(task.getProject(), currentUserId);
        
        return convertToTaskResponse(task);
    }
    
    /**
     * Get all tasks for a project
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProject(UUID projectId, UUID currentUserId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));
        
        // Validate user has access to the project
        validateProjectAccess(project, currentUserId);
        
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        return tasks.stream()
            .map(this::convertToTaskResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get subtasks for a parent task
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getSubtasks(UUID parentTaskId, UUID currentUserId) {
        Task parentTask = taskRepository.findById(parentTaskId)
            .orElseThrow(() -> new RuntimeException("Parent task not found"));
        
        // Validate user has access to the project
        validateProjectAccess(parentTask.getProject(), currentUserId);
        
        List<Task> subtasks = taskRepository.findByParentTask(parentTask);
        return subtasks.stream()
            .map(this::convertToTaskResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Update task
     */
    public TaskResponse updateTask(UUID taskId, TaskUpdateRequest request, UUID currentUserId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        // Validate user has access to the project
        validateProjectAccess(task.getProject(), currentUserId);
        
        // Validate due date is not in the past (if being updated)
        if (request.getDueDate() != null && request.getDueDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Due date cannot be in the past");
        }
        
        // Update fields if provided
        if (request.getTitle() != null) {
            task.setTitle(request.getTitle());
        }
        
        if (request.getDescription() != null) {
            task.setDescription(request.getDescription());
        }
        
        if (request.getStatus() != null) {
            task.setStatus(request.getStatus());
        }
        
        if (request.getPriority() != null) {
            task.setPriority(request.getPriority());
        }
        
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        
        // Update assignee if provided
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new RuntimeException("Assignee not found"));
            
            // Validate assignee has access to the project
            validateProjectAccess(task.getProject(), request.getAssigneeId());
            task.setAssignee(assignee);
        }
        
        // Update parent task if provided
        if (request.getParentTaskId() != null) {
            if (!request.getParentTaskId().equals(task.getId())) { // Prevent self-reference
                Task parentTask = taskRepository.findById(request.getParentTaskId())
                    .orElseThrow(() -> new RuntimeException("Parent task not found"));
                
                // Validate parent task belongs to the same project
                if (!parentTask.getProject().getId().equals(task.getProject().getId())) {
                    throw new RuntimeException("Parent task must belong to the same project");
                }
                
                // Prevent circular references
                validateNoCircularReference(task, parentTask);
                
                task.setParentTask(parentTask);
            }
        }
        
        // Save updated task
        Task updatedTask = taskRepository.save(task);
        
        return convertToTaskResponse(updatedTask);
    }
    
    /**
     * Delete task
     */
    public void deleteTask(UUID taskId, UUID currentUserId) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new RuntimeException("Task not found"));
        
        // Validate user has access to the project
        validateProjectAccess(task.getProject(), currentUserId);
        
        // Check if task has subtasks
        List<Task> subtasks = taskRepository.findByParentTask(task);
        if (!subtasks.isEmpty()) {
            throw new RuntimeException("Cannot delete task with subtasks. Delete subtasks first.");
        }
        
        taskRepository.delete(task);
    }
    
    /**
     * Get tasks assigned to current user
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(UUID currentUserId) {
        List<Task> tasks = taskRepository.findByAssigneeId(currentUserId);
        return tasks.stream()
            .map(this::convertToTaskResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Search and filter tasks with pagination
     */
    @Transactional(readOnly = true)
    public PagedTaskResponse searchTasks(TaskFilterRequest filter, int page, int size, UUID currentUserId) {
        // Create sort object
        Sort sort = createSort(filter.getSortBy(), filter.getSortDirection());
        Pageable pageable = PageRequest.of(page, size, sort);
        
        // Create specification for filtering
        Specification<Task> spec = createTaskSpecification(filter, currentUserId);
        
        // Execute query
        Page<Task> taskPage = taskRepository.findAll(spec, pageable);
        
        // Convert to response DTOs
        List<TaskResponse> taskResponses = taskPage.getContent().stream()
            .map(this::convertToTaskResponse)
            .collect(Collectors.toList());
        
        // Create paginated response
        return new PagedTaskResponse(
            taskResponses,
            taskPage.getNumber(),
            taskPage.getSize(),
            taskPage.getTotalElements(),
            taskPage.getTotalPages(),
            taskPage.isFirst(),
            taskPage.isLast(),
            taskPage.hasNext(),
            taskPage.hasPrevious()
        );
    }
    
    /**
     * Get overdue tasks for current user
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getOverdueTasks(UUID currentUserId) {
        List<Task> overdueTasks = taskRepository.findOverdueTasks(LocalDateTime.now());
        
        // Filter tasks that the user has access to
        return overdueTasks.stream()
            .filter(task -> hasTaskAccess(task, currentUserId))
            .map(this::convertToTaskResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Get tasks due within a date range
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksDueBetween(LocalDateTime startDate, LocalDateTime endDate, UUID currentUserId) {
        List<Task> tasks = taskRepository.findTasksDueBetween(startDate, endDate);
        
        // Filter tasks that the user has access to
        return tasks.stream()
            .filter(task -> hasTaskAccess(task, currentUserId))
            .map(this::convertToTaskResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Search tasks by title or description
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> searchTasksByText(String searchTerm, UUID currentUserId) {
        if (searchTerm == null || searchTerm.trim().isEmpty()) {
            return new ArrayList<>();
        }
        
        // Create specification for text search
        Specification<Task> spec = (root, query, criteriaBuilder) -> {
            String likePattern = "%" + searchTerm.toLowerCase() + "%";
            Predicate titleMatch = criteriaBuilder.like(
                criteriaBuilder.lower(root.get("title")), likePattern);
            Predicate descriptionMatch = criteriaBuilder.like(
                criteriaBuilder.lower(root.get("description")), likePattern);
            
            return criteriaBuilder.or(titleMatch, descriptionMatch);
        };
        
        List<Task> tasks = taskRepository.findAll(spec);
        
        // Filter tasks that the user has access to
        return tasks.stream()
            .filter(task -> hasTaskAccess(task, currentUserId))
            .map(this::convertToTaskResponse)
            .collect(Collectors.toList());
    }
    
    /**
     * Convert Task entity to TaskResponse DTO
     */
    private TaskResponse convertToTaskResponse(Task task) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setProjectId(task.getProject().getId());
        response.setProjectName(task.getProject().getName());
        response.setTitle(task.getTitle());
        response.setDescription(task.getDescription());
        response.setStatus(task.getStatus());
        response.setPriority(task.getPriority());
        response.setDueDate(task.getDueDate());
        response.setCreatedAt(task.getCreatedAt());
        response.setUpdatedAt(task.getUpdatedAt());
        
        // Set parent task info if exists
        if (task.getParentTask() != null) {
            response.setParentTaskId(task.getParentTask().getId());
            response.setParentTaskTitle(task.getParentTask().getTitle());
        }
        
        // Set assignee info if exists
        if (task.getAssignee() != null) {
            UserResponse assignee = new UserResponse();
            assignee.setId(task.getAssignee().getId());
            assignee.setEmail(task.getAssignee().getEmail());
            assignee.setFirstName(task.getAssignee().getFirstName());
            assignee.setLastName(task.getAssignee().getLastName());
            assignee.setRole(task.getAssignee().getRole());
            response.setAssignee(assignee);
        }
        
        // Set created by info
        if (task.getCreatedBy() != null) {
            UserResponse createdBy = new UserResponse();
            createdBy.setId(task.getCreatedBy().getId());
            createdBy.setEmail(task.getCreatedBy().getEmail());
            createdBy.setFirstName(task.getCreatedBy().getFirstName());
            createdBy.setLastName(task.getCreatedBy().getLastName());
            createdBy.setRole(task.getCreatedBy().getRole());
            response.setCreatedBy(createdBy);
        }
        
        // Check if task has subtasks
        List<Task> subtasks = taskRepository.findByParentTask(task);
        response.setHasSubtasks(!subtasks.isEmpty());
        response.setSubtaskCount(subtasks.size());
        
        return response;
    }
    
    /**
     * Validate user has access to the project
     */
    private void validateProjectAccess(Project project, UUID userId) {
        // This is a simplified check - in a real implementation, you would check
        // if the user is a member of the team that owns the project
        // For now, we'll assume all authenticated users have access
        // TODO: Implement proper project access validation based on team membership
    }
    
    /**
     * Validate no circular reference in parent-child relationships
     */
    private void validateNoCircularReference(Task task, Task potentialParent) {
        Task current = potentialParent;
        while (current != null) {
            if (current.getId().equals(task.getId())) {
                throw new RuntimeException("Circular reference detected in task hierarchy");
            }
            current = current.getParentTask();
        }
    }
    
    /**
     * Create JPA Specification for task filtering
     */
    private Specification<Task> createTaskSpecification(TaskFilterRequest filter, UUID currentUserId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Filter by project ID
            if (filter.getProjectId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("project").get("id"), filter.getProjectId()));
            }
            
            // Filter by assignee ID
            if (filter.getAssigneeId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("assignee").get("id"), filter.getAssigneeId()));
            }
            
            // Filter by status
            if (filter.getStatus() != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus()));
            }
            
            // Filter by priority
            if (filter.getPriority() != null) {
                predicates.add(criteriaBuilder.equal(root.get("priority"), filter.getPriority()));
            }
            
            // Filter by search term (title or description)
            if (filter.getSearchTerm() != null && !filter.getSearchTerm().trim().isEmpty()) {
                String likePattern = "%" + filter.getSearchTerm().toLowerCase() + "%";
                Predicate titleMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("title")), likePattern);
                Predicate descriptionMatch = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("description")), likePattern);
                predicates.add(criteriaBuilder.or(titleMatch, descriptionMatch));
            }
            
            // Filter by due date range
            if (filter.getDueDateFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("dueDate"), filter.getDueDateFrom()));
            }
            if (filter.getDueDateTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("dueDate"), filter.getDueDateTo()));
            }
            
            // Filter by creation date range
            if (filter.getCreatedFrom() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), filter.getCreatedFrom()));
            }
            if (filter.getCreatedTo() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), filter.getCreatedTo()));
            }
            
            // Filter by subtask existence
            if (filter.getHasSubtasks() != null) {
                if (filter.getHasSubtasks()) {
                    // Has subtasks - check if there are tasks that have this task as parent
                    var subquery = query.subquery(Long.class);
                    var subRoot = subquery.from(Task.class);
                    subquery.select(criteriaBuilder.count(subRoot))
                        .where(criteriaBuilder.equal(subRoot.get("parentTask").get("id"), root.get("id")));
                    predicates.add(criteriaBuilder.greaterThan(subquery, 0L));
                } else {
                    // No subtasks - check if there are no tasks that have this task as parent
                    var subquery = query.subquery(Long.class);
                    var subRoot = subquery.from(Task.class);
                    subquery.select(criteriaBuilder.count(subRoot))
                        .where(criteriaBuilder.equal(subRoot.get("parentTask").get("id"), root.get("id")));
                    predicates.add(criteriaBuilder.equal(subquery, 0L));
                }
            }
            
            // Filter by overdue status
            if (filter.getIsOverdue() != null && filter.getIsOverdue()) {
                predicates.add(criteriaBuilder.and(
                    criteriaBuilder.lessThan(root.get("dueDate"), LocalDateTime.now()),
                    criteriaBuilder.notEqual(root.get("status"), com.taskmanagement.entity.TaskStatus.COMPLETED)
                ));
            }
            
            // TODO: Add access control based on user's project memberships
            // For now, we'll add a placeholder that can be implemented later
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
    
    /**
     * Create Sort object based on sort parameters
     */
    private Sort createSort(String sortBy, String sortDirection) {
        // Validate sort field
        String validSortBy;
        switch (sortBy != null ? sortBy.toLowerCase() : "createdat") {
            case "title":
                validSortBy = "title";
                break;
            case "status":
                validSortBy = "status";
                break;
            case "priority":
                validSortBy = "priority";
                break;
            case "duedate":
                validSortBy = "dueDate";
                break;
            case "updatedat":
                validSortBy = "updatedAt";
                break;
            case "createdat":
            default:
                validSortBy = "createdAt";
                break;
        }
        
        // Validate sort direction
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) 
            ? Sort.Direction.ASC 
            : Sort.Direction.DESC;
        
        return Sort.by(direction, validSortBy);
    }
    
    /**
     * Check if user has access to a specific task
     */
    private boolean hasTaskAccess(Task task, UUID userId) {
        // Simplified access check - in a real implementation, you would check
        // if the user is a member of the team that owns the project
        // For now, we'll assume all authenticated users have access
        // TODO: Implement proper task access validation based on project membership
        return true;
    }
}