package com.taskmanagement.repository;

import com.taskmanagement.entity.Project;
import com.taskmanagement.entity.ProjectMember;
import com.taskmanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for ProjectMember entity operations
 */
@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    
    /**
     * Find project members by project
     */
    List<ProjectMember> findByProject(Project project);
    
    /**
     * Find project members by project ID
     */
    List<ProjectMember> findByProjectId(UUID projectId);
    
    /**
     * Find projects by user
     */
    List<ProjectMember> findByUser(User user);
    
    /**
     * Find projects by user ID
     */
    List<ProjectMember> findByUserId(UUID userId);
    
    /**
     * Find specific project member by project and user
     */
    Optional<ProjectMember> findByProjectAndUser(Project project, User user);
    
    /**
     * Find specific project member by project ID and user ID
     */
    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);
    
    /**
     * Check if user is assigned to project
     */
    boolean existsByProjectAndUser(Project project, User user);
    
    /**
     * Check if user is assigned to project by IDs
     */
    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
    
    /**
     * Find projects assigned to a user
     */
    @Query("SELECT pm.project FROM ProjectMember pm WHERE pm.user.id = :userId")
    List<Project> findProjectsByUserId(@Param("userId") UUID userId);
    
    /**
     * Find users assigned to a project
     */
    @Query("SELECT pm.user FROM ProjectMember pm WHERE pm.project.id = :projectId")
    List<User> findUsersByProjectId(@Param("projectId") UUID projectId);
    
    /**
     * Count members in a project
     */
    long countByProject(Project project);
    
    /**
     * Count members in a project by ID
     */
    long countByProjectId(UUID projectId);
    
    /**
     * Find project members assigned by a specific user
     */
    List<ProjectMember> findByAssignedBy(User assignedBy);
    
    /**
     * Find project members assigned by a specific user ID
     */
    List<ProjectMember> findByAssignedById(UUID assignedById);
    
    /**
     * Delete project member by project and user
     */
    void deleteByProjectAndUser(Project project, User user);
    
    /**
     * Delete project member by project ID and user ID
     */
    void deleteByProjectIdAndUserId(UUID projectId, UUID userId);
    
    /**
     * Delete all members of a project
     */
    void deleteByProject(Project project);
    
    /**
     * Delete all members of a project by ID
     */
    void deleteByProjectId(UUID projectId);
}