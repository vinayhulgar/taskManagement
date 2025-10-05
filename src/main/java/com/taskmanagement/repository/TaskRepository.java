package com.taskmanagement.repository;

import com.taskmanagement.entity.Priority;
import com.taskmanagement.entity.Project;
import com.taskmanagement.entity.Task;
import com.taskmanagement.entity.TaskStatus;
import com.taskmanagement.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Task entity operations
 */
@Repository
public interface TaskRepository extends JpaRepository<Task, UUID>, JpaSpecificationExecutor<Task> {
    
    /**
     * Find tasks by project
     */
    List<Task> findByProject(Project project);
    
    /**
     * Find tasks by project ID
     */
    List<Task> findByProjectId(UUID projectId);
    
    /**
     * Find tasks by assignee
     */
    List<Task> findByAssignee(User assignee);
    
    /**
     * Find tasks by assignee ID
     */
    List<Task> findByAssigneeId(UUID assigneeId);
    
    /**
     * Find tasks by status
     */
    List<Task> findByStatus(TaskStatus status);
    
    /**
     * Find tasks by priority
     */
    List<Task> findByPriority(Priority priority);
    
    /**
     * Find tasks by parent task (subtasks)
     */
    List<Task> findByParentTask(Task parentTask);
    
    /**
     * Find root tasks (tasks without parent)
     */
    List<Task> findByParentTaskIsNull();
    
    /**
     * Find tasks by project and status
     */
    List<Task> findByProjectAndStatus(Project project, TaskStatus status);
    
    /**
     * Find tasks by project and assignee
     */
    List<Task> findByProjectAndAssignee(Project project, User assignee);
    
    /**
     * Find tasks by title containing (case insensitive)
     */
    List<Task> findByTitleContainingIgnoreCase(String title);
    
    /**
     * Find overdue tasks (due date passed and not completed)
     */
    @Query("SELECT t FROM Task t WHERE t.dueDate < :now AND t.status NOT IN ('COMPLETED')")
    List<Task> findOverdueTasks(@Param("now") LocalDateTime now);
    
    /**
     * Find tasks due within a specific date range
     */
    @Query("SELECT t FROM Task t WHERE t.dueDate BETWEEN :startDate AND :endDate")
    List<Task> findTasksDueBetween(
        @Param("startDate") LocalDateTime startDate, 
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * Find tasks assigned to user with specific status
     */
    @Query("SELECT t FROM Task t WHERE t.assignee.id = :assigneeId AND t.status = :status")
    List<Task> findByAssigneeIdAndStatus(@Param("assigneeId") UUID assigneeId, @Param("status") TaskStatus status);
    
    /**
     * Find tasks by multiple criteria with pagination
     */
    @Query("SELECT t FROM Task t WHERE " +
           "(:projectId IS NULL OR t.project.id = :projectId) AND " +
           "(:assigneeId IS NULL OR t.assignee.id = :assigneeId) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority)")
    Page<Task> findTasksByCriteria(
        @Param("projectId") UUID projectId,
        @Param("assigneeId") UUID assigneeId,
        @Param("status") TaskStatus status,
        @Param("priority") Priority priority,
        Pageable pageable
    );
    
    /**
     * Count tasks by project and status
     */
    long countByProjectAndStatus(Project project, TaskStatus status);
    
    /**
     * Count tasks assigned to user by status
     */
    long countByAssigneeAndStatus(User assignee, TaskStatus status);
    
    /**
     * Find high priority tasks for a project
     */
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.priority IN ('HIGH', 'CRITICAL')")
    List<Task> findHighPriorityTasksByProjectId(@Param("projectId") UUID projectId);
    
    /**
     * Find tasks created by a specific user
     */
    List<Task> findByCreatedBy(User createdBy);
    
    /**
     * Find tasks in a project that are not assigned
     */
    @Query("SELECT t FROM Task t WHERE t.project.id = :projectId AND t.assignee IS NULL")
    List<Task> findUnassignedTasksByProjectId(@Param("projectId") UUID projectId);
}