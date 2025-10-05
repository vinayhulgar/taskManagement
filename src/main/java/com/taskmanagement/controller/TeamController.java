package com.taskmanagement.controller;

import com.taskmanagement.dto.*;
import com.taskmanagement.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for team management operations
 */
@RestController
@RequestMapping("/api/v1/teams")
@Tag(name = "Team Management", description = "APIs for managing teams")
@SecurityRequirement(name = "bearerAuth")
public class TeamController {
    
    private final TeamService teamService;
    
    @Autowired
    public TeamController(TeamService teamService) {
        this.teamService = teamService;
    }
    
    /**
     * Create a new team
     */
    @PostMapping
    @Operation(summary = "Create a new team", description = "Create a new team with the authenticated user as owner")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Team created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "409", description = "Team name already exists")
    })
    public ResponseEntity<TeamResponse> createTeam(
            @Valid @RequestBody TeamCreateRequest request,
            Authentication authentication) {
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        UUID ownerId = UUID.fromString(userDetails.getUsername());
        
        TeamResponse response = teamService.createTeam(request, ownerId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    /**
     * Get all teams for the authenticated user
     */
    @GetMapping
    @Operation(summary = "Get user teams", description = "Get all teams where the authenticated user is a member")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Teams retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<List<TeamResponse>> getUserTeams(Authentication authentication) {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        UUID userId = UUID.fromString(userDetails.getUsername());
        
        List<TeamResponse> teams = teamService.getUserTeams(userId);
        return ResponseEntity.ok(teams);
    }
    
    /**
     * Get team by ID
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get team by ID", description = "Get team details by team ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Team retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Team not found")
    })
    public ResponseEntity<TeamResponse> getTeamById(
            @Parameter(description = "Team ID") @PathVariable UUID id) {
        
        TeamResponse response = teamService.getTeamById(id);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Update team
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update team", description = "Update team details (owner or admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Team updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Team not found"),
        @ApiResponse(responseCode = "409", description = "Team name already exists")
    })
    public ResponseEntity<TeamResponse> updateTeam(
            @Parameter(description = "Team ID") @PathVariable UUID id,
            @Valid @RequestBody TeamUpdateRequest request) {
        
        TeamResponse response = teamService.updateTeam(id, request);
        return ResponseEntity.ok(response);
    }
    
    /**
     * Delete team
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete team", description = "Delete team (owner or admin only)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Team deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Team not found")
    })
    public ResponseEntity<Void> deleteTeam(
            @Parameter(description = "Team ID") @PathVariable UUID id) {
        
        teamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }
    
    /**
     * Invite user to team
     */
    @PostMapping("/{id}/members")
    @Operation(summary = "Invite user to team", description = "Invite a user to join the team by email")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "User invited successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data or user already member"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Team or user not found")
    })
    public ResponseEntity<TeamMemberResponse> inviteUserToTeam(
            @Parameter(description = "Team ID") @PathVariable UUID id,
            @Valid @RequestBody TeamMemberInviteRequest request,
            Authentication authentication) {
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String inviterEmail = userDetails.getUsername();
        
        TeamMemberResponse response = teamService.inviteUserToTeam(id, request, inviterEmail);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    /**
     * Get team members
     */
    @GetMapping("/{id}/members")
    @Operation(summary = "Get team members", description = "Get all members of the team")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Team members retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Team not found")
    })
    public ResponseEntity<List<TeamMemberResponse>> getTeamMembers(
            @Parameter(description = "Team ID") @PathVariable UUID id) {
        
        List<TeamMemberResponse> members = teamService.getTeamMembers(id);
        return ResponseEntity.ok(members);
    }
    
    /**
     * Remove user from team
     */
    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Remove user from team", description = "Remove a user from the team")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "User removed successfully"),
        @ApiResponse(responseCode = "400", description = "Cannot remove team owner or user not member"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Insufficient permissions"),
        @ApiResponse(responseCode = "404", description = "Team or user not found")
    })
    public ResponseEntity<Void> removeUserFromTeam(
            @Parameter(description = "Team ID") @PathVariable UUID id,
            @Parameter(description = "User ID") @PathVariable UUID userId,
            Authentication authentication) {
        
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String removerEmail = userDetails.getUsername();
        
        teamService.removeUserFromTeam(id, userId, removerEmail);
        return ResponseEntity.noContent().build();
    }
}