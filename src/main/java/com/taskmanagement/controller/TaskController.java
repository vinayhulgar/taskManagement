package com.taskmanagement.controller;

import com.taskmanagement.dto.*;
import com.taskmanagement.service.CommentService;
import com.taskmanagement.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for task management operations
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Tasks", description = "Task management operations")
@SecurityRequirement(name = "bearerAuth")
public class TaskController {
    
    private final TaskService taskService;
    private final CommentService commentService;
    
    @Autowired
    public TaskController(TaskService taskService, CommentService commentService) {
        this.taskService = taskService;
        this.commentService = commentService;
    }
    
    /**
     * Create a new task in a project
     */
    @PostMapping("/projects/{projectId}/tasks")
    @Operation(summary = "Create a new task", description = "Create a new task within a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Task created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Project not found"),
        @ApiResponse(responseCode = "422", description = "Business logic validation failed")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<TaskResponse> createTask(
            @Parameter(description = "Project ID", required = true)
            @PathVariable UUID projectId,
            @Parameter(description = "Task creation data", required = true)
            @Valid @RequestBody TaskCreateRequest request,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        TaskResponse response = taskService.createTask(projectId, request, currentUserId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    /**
     * Get all tasks for a project
     */
    @GetMapping("/projects/{projectId}/tasks")
    @Operation(summary = "Get project tasks", description = "Retrieve all tasks for a specific project")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Project not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<TaskResponse>> getProjectTasks(
            @Parameter(description = "Project ID", required = true)
            @PathVariable UUID projectId,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        List<TaskResponse> tasks = taskService.getTasksByProject(projectId, currentUserId);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Get a specific task by ID
     */
    @GetMapping("/tasks/{taskId}")
    @Operation(summary = "Get task by ID", description = "Retrieve a specific task by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Task retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<TaskResponse> getTask(
            @Parameter(description = "Task ID", required = true)
            @PathVariable UUID taskId,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        TaskResponse task = taskService.getTaskById(taskId, currentUserId);
        return ResponseEntity.ok(task);
    }
    
    /**
     * Update a task
     */
    @PutMapping("/tasks/{taskId}")
    @Operation(summary = "Update task", description = "Update an existing task")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Task updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Task not found"),
        @ApiResponse(responseCode = "422", description = "Business logic validation failed")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<TaskResponse> updateTask(
            @Parameter(description = "Task ID", required = true)
            @PathVariable UUID taskId,
            @Parameter(description = "Task update data", required = true)
            @Valid @RequestBody TaskUpdateRequest request,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        TaskResponse response = taskService.updateTask(taskId, request, currentUserId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete a task
     */
    @DeleteMapping("/tasks/{taskId}")
    @Operation(summary = "Delete task", description = "Delete an existing task")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Task deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Task not found"),
        @ApiResponse(responseCode = "422", description = "Cannot delete task with subtasks")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<Void> deleteTask(
            @Parameter(description = "Task ID", required = true)
            @PathVariable UUID taskId,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        taskService.deleteTask(taskId, currentUserId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get subtasks for a parent task
     */
    @GetMapping("/tasks/{taskId}/subtasks")
    @Operation(summary = "Get subtasks", description = "Retrieve all subtasks for a parent task")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Subtasks retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Parent task not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<TaskResponse>> getSubtasks(
            @Parameter(description = "Parent task ID", required = true)
            @PathVariable UUID taskId,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        List<TaskResponse> subtasks = taskService.getSubtasks(taskId, currentUserId);
        return ResponseEntity.ok(subtasks);
    }
    
    /**
     * Get tasks assigned to current user
     */
    @GetMapping("/tasks/my-tasks")
    @Operation(summary = "Get my tasks", description = "Retrieve all tasks assigned to the current user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<TaskResponse>> getMyTasks(Authentication authentication) {
        UUID currentUserId = getCurrentUserId(authentication);
        List<TaskResponse> tasks = taskService.getMyTasks(currentUserId);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Search and filter tasks with pagination
     */
    @GetMapping("/tasks/search")
    @Operation(summary = "Search and filter tasks", description = "Search and filter tasks with pagination support")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid filter parameters"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<PagedTaskResponse> searchTasks(
            @Parameter(description = "Project ID filter") @RequestParam(required = false) UUID projectId,
            @Parameter(description = "Assignee ID filter") @RequestParam(required = false) UUID assigneeId,
            @Parameter(description = "Task status filter") @RequestParam(required = false) String status,
            @Parameter(description = "Task priority filter") @RequestParam(required = false) String priority,
            @Parameter(description = "Search term for title/description") @RequestParam(required = false) String searchTerm,
            @Parameter(description = "Due date from") @RequestParam(required = false) 
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueDateFrom,
            @Parameter(description = "Due date to") @RequestParam(required = false) 
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime dueDateTo,
            @Parameter(description = "Created from") @RequestParam(required = false) 
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createdFrom,
            @Parameter(description = "Created to") @RequestParam(required = false) 
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime createdTo,
            @Parameter(description = "Has subtasks filter") @RequestParam(required = false) Boolean hasSubtasks,
            @Parameter(description = "Is overdue filter") @RequestParam(required = false) Boolean isOverdue,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "createdAt") String sortBy,
            @Parameter(description = "Sort direction") @RequestParam(defaultValue = "desc") String sortDirection,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        
        // Create filter request
        TaskFilterRequest filter = new TaskFilterRequest();
        filter.setProjectId(projectId);
        filter.setAssigneeId(assigneeId);
        filter.setSearchTerm(searchTerm);
        filter.setDueDateFrom(dueDateFrom);
        filter.setDueDateTo(dueDateTo);
        filter.setCreatedFrom(createdFrom);
        filter.setCreatedTo(createdTo);
        filter.setHasSubtasks(hasSubtasks);
        filter.setIsOverdue(isOverdue);
        filter.setSortBy(sortBy);
        filter.setSortDirection(sortDirection);
        
        // Parse enum values
        if (status != null) {
            try {
                filter.setStatus(com.taskmanagement.entity.TaskStatus.valueOf(status.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid task status: " + status);
            }
        }
        
        if (priority != null) {
            try {
                filter.setPriority(com.taskmanagement.entity.Priority.valueOf(priority.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid task priority: " + priority);
            }
        }
        
        PagedTaskResponse response = taskService.searchTasks(filter, page, size, currentUserId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get overdue tasks
     */
    @GetMapping("/tasks/overdue")
    @Operation(summary = "Get overdue tasks", description = "Retrieve all overdue tasks accessible to the current user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Overdue tasks retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<TaskResponse>> getOverdueTasks(Authentication authentication) {
        UUID currentUserId = getCurrentUserId(authentication);
        List<TaskResponse> tasks = taskService.getOverdueTasks(currentUserId);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Get tasks due within a date range
     */
    @GetMapping("/tasks/due-between")
    @Operation(summary = "Get tasks due between dates", description = "Retrieve tasks due within a specific date range")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid date parameters"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<TaskResponse>> getTasksDueBetween(
            @Parameter(description = "Start date", required = true) @RequestParam 
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @Parameter(description = "End date", required = true) @RequestParam 
                @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        List<TaskResponse> tasks = taskService.getTasksDueBetween(startDate, endDate, currentUserId);
        return ResponseEntity.ok(tasks);
    }
    
    /**
     * Search tasks by text
     */
    @GetMapping("/tasks/search-text")
    @Operation(summary = "Search tasks by text", description = "Search tasks by title or description text")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Tasks retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid search term"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<TaskResponse>> searchTasksByText(
            @Parameter(description = "Search term", required = true) @RequestParam String searchTerm,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        List<TaskResponse> tasks = taskService.searchTasksByText(searchTerm, currentUserId);
        return ResponseEntity.ok(tasks);
    }
    
    // ========== COMMENT ENDPOINTS ==========
    
    /**
     * Add a comment to a task
     */
    @PostMapping("/tasks/{taskId}/comments")
    @Operation(summary = "Add comment to task", description = "Add a new comment to a specific task")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Comment created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<CommentResponse> addComment(
            @Parameter(description = "Task ID", required = true) @PathVariable UUID taskId,
            @Parameter(description = "Comment data", required = true) @Valid @RequestBody CommentCreateRequest request,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        CommentResponse response = commentService.createComment(taskId, request, currentUserId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    /**
     * Get all comments for a task
     */
    @GetMapping("/tasks/{taskId}/comments")
    @Operation(summary = "Get task comments", description = "Retrieve all comments for a specific task")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Comments retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<CommentResponse>> getTaskComments(
            @Parameter(description = "Task ID", required = true) @PathVariable UUID taskId,
            @Parameter(description = "Page number") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        List<CommentResponse> comments = commentService.getTaskComments(taskId, page, size, currentUserId);
        return ResponseEntity.ok(comments);
    }
    
    /**
     * Get all comments for a task (without pagination)
     */
    @GetMapping("/tasks/{taskId}/comments/all")
    @Operation(summary = "Get all task comments", description = "Retrieve all comments for a task without pagination")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Comments retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<CommentResponse>> getAllTaskComments(
            @Parameter(description = "Task ID", required = true) @PathVariable UUID taskId,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        List<CommentResponse> comments = commentService.getAllTaskComments(taskId, currentUserId);
        return ResponseEntity.ok(comments);
    }
    
    /**
     * Get a specific comment by ID
     */
    @GetMapping("/comments/{commentId}")
    @Operation(summary = "Get comment by ID", description = "Retrieve a specific comment by its ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Comment retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Comment not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<CommentResponse> getComment(
            @Parameter(description = "Comment ID", required = true) @PathVariable UUID commentId,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        CommentResponse comment = commentService.getCommentById(commentId, currentUserId);
        return ResponseEntity.ok(comment);
    }
    
    /**
     * Update a comment
     */
    @PutMapping("/comments/{commentId}")
    @Operation(summary = "Update comment", description = "Update an existing comment")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Comment updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - can only edit own comments"),
        @ApiResponse(responseCode = "404", description = "Comment not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<CommentResponse> updateComment(
            @Parameter(description = "Comment ID", required = true) @PathVariable UUID commentId,
            @Parameter(description = "Comment update data", required = true) @Valid @RequestBody CommentUpdateRequest request,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        CommentResponse response = commentService.updateComment(commentId, request, currentUserId);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete a comment
     */
    @DeleteMapping("/comments/{commentId}")
    @Operation(summary = "Delete comment", description = "Delete an existing comment")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Comment deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - can only delete own comments"),
        @ApiResponse(responseCode = "404", description = "Comment not found"),
        @ApiResponse(responseCode = "422", description = "Cannot delete comment with replies")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<Void> deleteComment(
            @Parameter(description = "Comment ID", required = true) @PathVariable UUID commentId,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        commentService.deleteComment(commentId, currentUserId);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Get recent comments for a task
     */
    @GetMapping("/tasks/{taskId}/comments/recent")
    @Operation(summary = "Get recent comments", description = "Get recent comments for a task within specified days")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Recent comments retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<CommentResponse>> getRecentComments(
            @Parameter(description = "Task ID", required = true) @PathVariable UUID taskId,
            @Parameter(description = "Number of days") @RequestParam(defaultValue = "7") int days,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        List<CommentResponse> comments = commentService.getRecentComments(taskId, days, currentUserId);
        return ResponseEntity.ok(comments);
    }
    
    /**
     * Search comments by content
     */
    @GetMapping("/tasks/{taskId}/comments/search")
    @Operation(summary = "Search comments", description = "Search comments by content within a task")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Comments retrieved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid search term"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Task not found")
    })
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<List<CommentResponse>> searchComments(
            @Parameter(description = "Task ID", required = true) @PathVariable UUID taskId,
            @Parameter(description = "Search term", required = true) @RequestParam String searchTerm,
            Authentication authentication) {
        
        UUID currentUserId = getCurrentUserId(authentication);
        List<CommentResponse> comments = commentService.searchComments(taskId, searchTerm, currentUserId);
        return ResponseEntity.ok(comments);
    }
    
    /**
     * Extract current user ID from authentication token
     */
    private UUID getCurrentUserId(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        return UUID.fromString(userDetails.getUsername());
    }
}