package com.taskmanagement.repository;

import com.taskmanagement.entity.Role;
import com.taskmanagement.entity.Team;
import com.taskmanagement.entity.TeamMember;
import com.taskmanagement.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class TeamMemberRepositoryTest {
    
    @Autowired
    private TestEntityManager entityManager;
    
    @Autowired
    private TeamMemberRepository teamMemberRepository;
    
    private User owner;
    private User member1;
    private User member2;
    private Team team1;
    private Team team2;
    private TeamMember teamMember1;
    private TeamMember teamMember2;
    
    @BeforeEach
    void setUp() {
        // Create users
        owner = new User();
        owner.setEmail("owner@example.com");
        owner.setPasswordHash("hashedPassword");
        owner.setFirstName("Team");
        owner.setLastName("Owner");
        owner.setRole(Role.MANAGER);
        owner.setCreatedAt(LocalDateTime.now());
        owner.setUpdatedAt(LocalDateTime.now());
        owner = entityManager.persistAndFlush(owner);
        
        member1 = new User();
        member1.setEmail("member1@example.com");
        member1.setPasswordHash("hashedPassword");
        member1.setFirstName("Member");
        member1.setLastName("One");
        member1.setRole(Role.MEMBER);
        member1.setCreatedAt(LocalDateTime.now());
        member1.setUpdatedAt(LocalDateTime.now());
        member1 = entityManager.persistAndFlush(member1);
        
        member2 = new User();
        member2.setEmail("member2@example.com");
        member2.setPasswordHash("hashedPassword");
        member2.setFirstName("Member");
        member2.setLastName("Two");
        member2.setRole(Role.MEMBER);
        member2.setCreatedAt(LocalDateTime.now());
        member2.setUpdatedAt(LocalDateTime.now());
        member2 = entityManager.persistAndFlush(member2);
        
        // Create teams
        team1 = new Team();
        team1.setName("Team One");
        team1.setDescription("First team");
        team1.setOwner(owner);
        team1.setCreatedAt(LocalDateTime.now());
        team1.setUpdatedAt(LocalDateTime.now());
        team1 = entityManager.persistAndFlush(team1);
        
        team2 = new Team();
        team2.setName("Team Two");
        team2.setDescription("Second team");
        team2.setOwner(owner);
        team2.setCreatedAt(LocalDateTime.now());
        team2.setUpdatedAt(LocalDateTime.now());
        team2 = entityManager.persistAndFlush(team2);
        
        // Create team memberships
        teamMember1 = new TeamMember();
        teamMember1.setTeam(team1);
        teamMember1.setUser(member1);
        teamMember1.setInvitedBy(owner);
        teamMember1.setJoinedAt(LocalDateTime.now());
        teamMember1 = entityManager.persistAndFlush(teamMember1);
        
        teamMember2 = new TeamMember();
        teamMember2.setTeam(team2);
        teamMember2.setUser(member1);
        teamMember2.setInvitedBy(owner);
        teamMember2.setJoinedAt(LocalDateTime.now());
        teamMember2 = entityManager.persistAndFlush(teamMember2);
        
        entityManager.clear();
    }
    
    @Test
    void findByTeamAndUser_ExistingMembership_ReturnsMembership() {
        // Act
        Optional<TeamMember> result = teamMemberRepository.findByTeamAndUser(team1, member1);
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals(teamMember1.getId(), result.get().getId());
        assertEquals(team1.getId(), result.get().getTeam().getId());
        assertEquals(member1.getId(), result.get().getUser().getId());
    }
    
    @Test
    void findByTeamAndUser_NonExistingMembership_ReturnsEmpty() {
        // Act
        Optional<TeamMember> result = teamMemberRepository.findByTeamAndUser(team1, member2);
        
        // Assert
        assertFalse(result.isPresent());
    }
    
    @Test
    void findByTeamIdAndUserId_ExistingMembership_ReturnsMembership() {
        // Act
        Optional<TeamMember> result = teamMemberRepository.findByTeamIdAndUserId(team1.getId(), member1.getId());
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals(teamMember1.getId(), result.get().getId());
    }
    
    @Test
    void existsByTeamIdAndUserId_ExistingMembership_ReturnsTrue() {
        // Act
        boolean exists = teamMemberRepository.existsByTeamIdAndUserId(team1.getId(), member1.getId());
        
        // Assert
        assertTrue(exists);
    }
    
    @Test
    void existsByTeamIdAndUserId_NonExistingMembership_ReturnsFalse() {
        // Act
        boolean exists = teamMemberRepository.existsByTeamIdAndUserId(team1.getId(), member2.getId());
        
        // Assert
        assertFalse(exists);
    }
    
    @Test
    void findByTeam_ReturnsAllMembersOfTeam() {
        // Act
        List<TeamMember> members = teamMemberRepository.findByTeam(team1);
        
        // Assert
        assertEquals(1, members.size());
        assertEquals(member1.getId(), members.get(0).getUser().getId());
    }
    
    @Test
    void findByTeamId_ReturnsAllMembersOfTeam() {
        // Act
        List<TeamMember> members = teamMemberRepository.findByTeamId(team1.getId());
        
        // Assert
        assertEquals(1, members.size());
        assertEquals(member1.getId(), members.get(0).getUser().getId());
    }
    
    @Test
    void findByUser_ReturnsAllTeamsForUser() {
        // Act
        List<TeamMember> memberships = teamMemberRepository.findByUser(member1);
        
        // Assert
        assertEquals(2, memberships.size());
        assertTrue(memberships.stream().anyMatch(m -> m.getTeam().getId().equals(team1.getId())));
        assertTrue(memberships.stream().anyMatch(m -> m.getTeam().getId().equals(team2.getId())));
    }
    
    @Test
    void findByUserId_ReturnsAllTeamsForUser() {
        // Act
        List<TeamMember> memberships = teamMemberRepository.findByUserId(member1.getId());
        
        // Assert
        assertEquals(2, memberships.size());
    }
    
    @Test
    void countByTeamId_ReturnsCorrectCount() {
        // Act
        long count = teamMemberRepository.countByTeamId(team1.getId());
        
        // Assert
        assertEquals(1, count);
    }
    
    @Test
    void countByUserId_ReturnsCorrectCount() {
        // Act
        long count = teamMemberRepository.countByUserId(member1.getId());
        
        // Assert
        assertEquals(2, count);
    }
    
    @Test
    void findTeamsByUserId_ReturnsTeamsWhereUserIsMemberOrOwner() {
        // Act
        List<Team> teams = teamMemberRepository.findTeamsByUserId(member1.getId());
        
        // Assert
        assertEquals(2, teams.size());
        assertTrue(teams.stream().anyMatch(t -> t.getId().equals(team1.getId())));
        assertTrue(teams.stream().anyMatch(t -> t.getId().equals(team2.getId())));
    }
    
    @Test
    void findTeamsByUserId_ForOwner_ReturnsOwnedTeams() {
        // Act
        List<Team> teams = teamMemberRepository.findTeamsByUserId(owner.getId());
        
        // Assert
        assertEquals(2, teams.size());
        assertTrue(teams.stream().allMatch(t -> t.getOwner().getId().equals(owner.getId())));
    }
    
    @Test
    void deleteByTeamIdAndUserId_RemovesMembership() {
        // Arrange
        assertTrue(teamMemberRepository.existsByTeamIdAndUserId(team1.getId(), member1.getId()));
        
        // Act
        teamMemberRepository.deleteByTeamIdAndUserId(team1.getId(), member1.getId());
        entityManager.flush();
        
        // Assert
        assertFalse(teamMemberRepository.existsByTeamIdAndUserId(team1.getId(), member1.getId()));
    }
    
    @Test
    void deleteByTeamId_RemovesAllMembershipsForTeam() {
        // Arrange
        assertEquals(1, teamMemberRepository.countByTeamId(team1.getId()));
        
        // Act
        teamMemberRepository.deleteByTeamId(team1.getId());
        entityManager.flush();
        
        // Assert
        assertEquals(0, teamMemberRepository.countByTeamId(team1.getId()));
        // Other team memberships should remain
        assertEquals(1, teamMemberRepository.countByTeamId(team2.getId()));
    }
    
    @Test
    void deleteByUserId_RemovesAllMembershipsForUser() {
        // Arrange
        assertEquals(2, teamMemberRepository.countByUserId(member1.getId()));
        
        // Act
        teamMemberRepository.deleteByUserId(member1.getId());
        entityManager.flush();
        
        // Assert
        assertEquals(0, teamMemberRepository.countByUserId(member1.getId()));
    }
    
    @Test
    void save_UniqueConstraint_PreventsDuplicateMembership() {
        // Arrange
        TeamMember duplicate = new TeamMember();
        duplicate.setTeam(team1);
        duplicate.setUser(member1);
        duplicate.setInvitedBy(owner);
        duplicate.setJoinedAt(LocalDateTime.now());
        
        // Act & Assert
        assertThrows(Exception.class, () -> {
            entityManager.persistAndFlush(duplicate);
        });
    }
}